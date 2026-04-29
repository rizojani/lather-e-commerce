import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../schemas/cart.schema';

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private readonly model: Model<CartDocument>) {}

  findByUser(userId: string) {
    return this.model.findOne({ user: userId }).populate('items.product').exec();
  }

  upsertByUser(userId: string, payload: Partial<Cart>) {
    return this.model
      .findOneAndUpdate({ user: userId }, payload, { upsert: true, new: true })
      .populate('items.product')
      .exec();
  }
}
