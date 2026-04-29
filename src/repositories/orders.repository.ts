import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';

@Injectable()
export class OrdersRepository {
  constructor(@InjectModel(Order.name) private readonly model: Model<OrderDocument>) {}

  create(payload: Partial<Order>) {
    return this.model.create(payload);
  }

  findByUser(userId: string) {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  listAll() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async trendingCurrentYear() {
    const start = new Date(new Date().getFullYear(), 0, 1);
    return this.model.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          orderedQty: { $sum: '$items.quantity' },
        },
      },
      { $sort: { orderedQty: -1 } },
      { $limit: 12 },
    ]);
  }
}
