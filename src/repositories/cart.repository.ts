import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../schemas/cart.schema';

interface CartOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private readonly model: Model<CartDocument>) {}

  findByOwner(owner: CartOwner) {
    const filter = owner.userId ? { user: owner.userId } : { sessionId: owner.sessionId };
    return this.model.findOne(filter).populate('items.product').exec();
  }

  upsertByOwner(owner: CartOwner, payload: Partial<Cart>) {
    const filter = owner.userId ? { user: owner.userId } : { sessionId: owner.sessionId };
    return this.model
      .findOneAndUpdate(filter, payload, { upsert: true, new: true })
      .populate('items.product')
      .exec();
  }
}
