import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type PipelineStage } from 'mongoose';
import { escapeRegex } from '../common/utils/escape-regex';
import { PaymentLog, PaymentLogDocument, PaymentLogOwnerType, PaymentStatus } from '../schemas/payment-log.schema';
import { Order, OrderDocument, OrderStatus } from '../schemas/order.schema';
import { User, UserDocument } from '../schemas/user.schema';

interface OrderOwner {
  userId?: string;
  sessionId?: string;
}

export interface AdminOrdersListParams {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
  paymentStatus?: PaymentStatus;
  userId?: string;
}

/** Single round-trip: orders + line rows (`orderItems`), sorted per order. */
const ORDER_ITEMS_LOOKUP = {
  $lookup: {
    from: 'orderItems',
    let: { oid: '$_id' },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [{ $toString: { $ifNull: ['$orderId', ''] } }, { $toString: '$$oid' }],
          },
        },
      },
      { $sort: { createdAt: 1 } },
    ],
    as: 'items',
  },
};

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    @InjectModel(PaymentLog.name) private readonly paymentLogModel: Model<PaymentLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(payload: Partial<Order>) {
    return this.model.create(payload);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  updateStatus(id: string, status: Order['status']) {
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  updateOrderAdmin(id: string, status: Order['status'], statusReason: string | null) {
    return this.model
      .findByIdAndUpdate(id, { $set: { status, statusReason } }, { new: true })
      .exec();
  }

  findByOwner(owner: OrderOwner) {
    const filter = owner.userId ? { user: owner.userId } : { sessionId: owner.sessionId };
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /** Header rows + embedded `items` in one query (no second fetch + join in app code). */
  findByOwnerWithLineItems(owner: OrderOwner) {
    const filter = owner.userId ? { user: owner.userId } : { sessionId: owner.sessionId };
    return this.model
      .aggregate(
        [{ $match: filter }, { $sort: { createdAt: -1 } }, ORDER_ITEMS_LOOKUP] as PipelineStage[],
      )
      .exec();
  }

  listAll() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  listAllWithLineItems() {
    return this.model
      .aggregate([{ $sort: { createdAt: -1 } }, ORDER_ITEMS_LOOKUP] as PipelineStage[])
      .exec();
  }

  /**
   * One aggregation: filters, user + paymentLog + items, optional text search, then $facet count + page.
   * No per-order application queries (avoids N+1).
   */
  async adminOrdersPaginated(params: AdminOrdersListParams): Promise<{
    data: Record<string, unknown>[];
    total: number;
  }> {
    const { page, limit, search, status, fromDate, toDate, paymentStatus, userId } = params;
    const skip = (page - 1) * limit;
    const stages: PipelineStage[] = [];

    const preMatch: Record<string, unknown> = {};
    if (userId?.trim()) {
      preMatch.user = new Types.ObjectId(userId.trim());
    }
    if (status != null) {
      preMatch.status = status;
    }
    const createdRange: { $gte?: Date; $lte?: Date } = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) {
      createdRange.$gte = fromDate;
    }
    if (toDate && !Number.isNaN(toDate.getTime())) {
      createdRange.$lte = toDate;
    }
    if (Object.keys(createdRange).length > 0) {
      preMatch.createdAt = createdRange;
    }
    if (Object.keys(preMatch).length > 0) {
      stages.push({ $match: preMatch });
    }

    const userColl = this.userModel.collection.name;
    const payColl = this.paymentLogModel.collection.name;

    stages.push({
      $lookup: {
        from: userColl,
        let: { uid: '$user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: '$_id' }, { $toString: { $ifNull: ['$$uid', ''] } }],
              },
            },
          },
          {
            $project: {
              password: 0,
              passwordResetToken: 0,
              passwordResetTokenExpiresAt: 0,
            },
          },
          { $limit: 1 },
        ],
        as: 'userArr',
      },
    } as PipelineStage);
    stages.push({
      $addFields: { user: { $arrayElemAt: ['$userArr', 0] } },
    } as PipelineStage);
    stages.push({ $project: { userArr: 0 } } as PipelineStage);

    stages.push({
      $lookup: {
        from: payColl,
        let: { oid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$modelType', PaymentLogOwnerType.ORDER] },
                  { $eq: [{ $toString: '$modelId' }, { $toString: '$$oid' }] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'paymentLogArr',
      },
    } as PipelineStage);
    stages.push({
      $addFields: { paymentLog: { $arrayElemAt: ['$paymentLogArr', 0] } },
    } as PipelineStage);
    stages.push({ $project: { paymentLogArr: 0 } } as PipelineStage);

    if (paymentStatus === PaymentStatus.PAID) {
      stages.push({ $match: { 'paymentLog.status': PaymentStatus.PAID } } as PipelineStage);
    } else if (paymentStatus === PaymentStatus.UNPAID) {
      stages.push({
        $match: { $nor: [{ 'paymentLog.status': PaymentStatus.PAID }] },
      } as PipelineStage);
    }

    stages.push(ORDER_ITEMS_LOOKUP as PipelineStage);

    const searchTrim = search?.trim();
    if (searchTrim) {
      const rx = new RegExp(escapeRegex(searchTrim), 'i');
      stages.push({
        $lookup: {
          from: 'orderItems',
          let: { oid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: { $ifNull: ['$orderId', ''] } }, { $toString: '$$oid' }],
                },
              },
            },
            {
              $lookup: {
                from: 'products',
                let: { pid: '$productId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          { $toString: '$_id' },
                          { $toString: { $ifNull: ['$$pid', ''] } },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
                as: 'prod',
              },
            },
            { $addFields: { prod: { $arrayElemAt: ['$prod', 0] } } },
            {
              $lookup: {
                from: 'categories',
                let: { cref: '$prod.category' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          { $toString: '$_id' },
                          { $toString: { $ifNull: ['$$cref', ''] } },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
                as: 'cat',
              },
            },
            { $addFields: { cat: { $arrayElemAt: ['$cat', 0] } } },
            {
              $match: {
                $or: [{ 'prod.title': rx }, { 'prod.name': rx }, { 'cat.name': rx }],
              },
            },
            { $limit: 1 },
          ],
          as: 'itemSearchHits',
        },
      } as PipelineStage);
      stages.push({
        $match: {
          $or: [
            { 'user.name': rx },
            { 'user.firstName': rx },
            { 'user.lastName': rx },
            { 'user.email': rx },
            { $expr: { $gt: [{ $size: { $ifNull: ['$itemSearchHits', []] } }, 0] } },
          ],
        },
      } as PipelineStage);
      stages.push({ $project: { itemSearchHits: 0 } } as PipelineStage);
    }

    stages.push({
      $facet: {
        meta: [{ $count: 'total' }],
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
      },
    } as PipelineStage);

    const agg = await this.model.aggregate(stages as PipelineStage[]).exec();
    const bucket = agg[0] as { meta?: { total: number }[]; data?: Record<string, unknown>[] } | undefined;
    const total = bucket?.meta?.[0]?.total ?? 0;
    const data = bucket?.data ?? [];
    return { data, total };
  }
}
