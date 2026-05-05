import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type PipelineStage } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';

interface OrderOwner {
  userId?: string;
  sessionId?: string;
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
  constructor(@InjectModel(Order.name) private readonly model: Model<OrderDocument>) {}

  create(payload: Partial<Order>) {
    return this.model.create(payload);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  updateStatus(id: string, status: Order['status']) {
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).exec();
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
}
