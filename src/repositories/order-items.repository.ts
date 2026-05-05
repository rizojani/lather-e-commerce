import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type PipelineStage } from 'mongoose';
import { Media } from '../schemas/media.schema';
import { OrderItem, OrderItemDocument } from '../schemas/order-item.schema';

const productAndMediaPopulate = {
  path: 'productId',
  populate: { path: 'media', model: Media.name },
};

export interface OrderItemLineInput {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
  /** Pre-discount unit price (cart snapshot). */
  price?: number;
  discount?: number;
}

/** Match line rows whether `orderId` is stored as ObjectId or string (legacy / mixed data). */
function matchOrderIdExpr(orderId: string) {
  const t = orderId.trim();
  return {
    $expr: {
      $eq: [{ $toString: { $ifNull: ['$orderId', ''] } }, t],
    },
  };
}

@Injectable()
export class OrderItemsRepository {
  constructor(@InjectModel(OrderItem.name) private readonly model: Model<OrderItemDocument>) {}

  async createManyForOrder(orderId: string, lines: OrderItemLineInput[]) {
    if (!lines.length) return [];
    const oid = new Types.ObjectId(orderId);
    return this.model.insertMany(
      lines.map((l) => ({
        orderId: oid,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        size: (l.size ?? '').trim(),
        color: (l.color ?? '').trim(),
        ...(l.price != null && !Number.isNaN(Number(l.price)) ? { price: Number(l.price) } : {}),
        ...(l.discount != null && !Number.isNaN(Number(l.discount))
          ? { discount: Number(l.discount) }
          : {}),
      })),
    );
  }

  findByOrderId(orderId: string) {
    return this.model.find(matchOrderIdExpr(orderId)).sort({ createdAt: 1 }).exec();
  }

  /** For GET /orders/:id — each line has `productId` populated with nested `media`. */
  findByOrderIdWithProductAndMedia(orderId: string) {
    return this.model
      .find(matchOrderIdExpr(orderId))
      .populate(productAndMediaPopulate)
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * One aggregation: order lines + product + category + media (ordered like product.media refs).
   * Avoids populate/N+1 by using $lookup only.
   */
  aggregateLinesForOrderDetail(orderId: string) {
    const pipeline: PipelineStage[] = [
      { $match: matchOrderIdExpr(orderId) },
      { $sort: { createdAt: 1 } },
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
          as: 'productArr',
        },
      },
      {
        $addFields: {
          productDoc: { $arrayElemAt: ['$productArr', 0] },
        },
      },
      {
        $lookup: {
          from: 'categories',
          let: { catRef: '$productDoc.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: '$_id' },
                    { $toString: { $ifNull: ['$$catRef', ''] } },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'categoryArr',
        },
      },
      {
        $addFields: {
          categoryDoc: { $arrayElemAt: ['$categoryArr', 0] },
        },
      },
      {
        $lookup: {
          from: 'media',
          let: { mediaRefs: { $ifNull: ['$productDoc.media', []] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: [{ $size: '$$mediaRefs' }, 0] },
                    { $in: ['$_id', '$$mediaRefs'] },
                  ],
                },
              },
            },
            {
              $addFields: {
                __sortIdx: { $indexOfArray: ['$$mediaRefs', '$_id'] },
              },
            },
            { $sort: { __sortIdx: 1 } },
            { $project: { __sortIdx: 0 } },
          ],
          as: 'resolvedMedia',
        },
      },
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$productArr', []] } }, 0] },
              then: {
                $mergeObjects: [
                  '$productDoc',
                  {
                    category: {
                      $cond: {
                        if: { $ne: [{ $ifNull: ['$categoryDoc', null] }, null] },
                        then: '$categoryDoc',
                        else: '$productDoc.category',
                      },
                    },
                    media: { $ifNull: ['$resolvedMedia', []] },
                  },
                ],
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          productArr: 0,
          productDoc: 0,
          categoryArr: 0,
          categoryDoc: 0,
          resolvedMedia: 0,
        },
      },
    ];

    return this.model.aggregate(pipeline).exec() as Promise<Array<Record<string, unknown>>>;
  }

  findByOrderIds(orderIds: Types.ObjectId[]) {
    if (!orderIds.length) return Promise.resolve([]);
    return this.model.find({ orderId: { $in: orderIds } }).sort({ createdAt: 1 }).lean().exec();
  }

  /** Top products this calendar year (by quantity), using line items joined to orders. */
  async aggregateTrendingProductsCurrentYear() {
    const start = new Date(new Date().getFullYear(), 0, 1);
    return this.model.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.createdAt': { $gte: start } } },
      {
        $group: {
          _id: '$productId',
          orderedQty: { $sum: '$quantity' },
        },
      },
      { $sort: { orderedQty: -1 } },
      { $limit: 12 },
    ]);
  }
}
