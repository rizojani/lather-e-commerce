import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartableType } from '../schemas/cart.schema';

export interface CartOwnerKey {
  userId?: string;
  sessionId?: string;
}

function ownerCartableId(owner: CartOwnerKey): string {
  const id = owner.userId ?? owner.sessionId;
  if (!id) return '';
  return String(id).trim();
}

/** Product + category only; medias loaded once via `MediaService.findByIdsIndexed` in `CartService` (no duplicate media query). */
const productPopulate = {
  path: 'productId',
  populate: { path: 'category' },
};

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private readonly model: Model<CartDocument>) {}

  findRootByOwner(owner: CartOwnerKey) {
    const cartableId = ownerCartableId(owner);
    if (!cartableId) return Promise.resolve(null);
    return this.model.findOne({ cartableType: CartableType.USER, cartableId }).exec();
  }

  async findOrCreateRootByOwner(owner: CartOwnerKey): Promise<CartDocument> {
    const existing = await this.findRootByOwner(owner);
    if (existing) return existing;
    const cartableId = ownerCartableId(owner);
    return this.model.create({
      cartableType: CartableType.USER,
      cartableId,
    });
  }

  findLinesByParentCartId(parentCartId: string) {
    return this.model
      .find({ cartableType: CartableType.CART, cartableId: parentCartId })
      .populate(productPopulate)
      .sort({ createdAt: 1 })
      .exec();
  }

  /** Lean rows for place-order: `productId` stays an ObjectId (no populate side-effects). */
  findCheckoutLinesByParentCartId(parentCartId: string) {
    return this.model
      .find({ cartableType: CartableType.CART, cartableId: parentCartId })
      .select('quantity price discount productId size color')
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  findLineByProductVariant(parentCartId: string, productId: string, size: string, color: string) {
    return this.model
      .findOne({
        cartableType: CartableType.CART,
        cartableId: parentCartId,
        productId: new Types.ObjectId(productId),
        size,
        color,
      })
      .exec();
  }

  async deleteLinesByProductId(parentCartId: string, productId: string) {
    await this.model
      .deleteMany({
        cartableType: CartableType.CART,
        cartableId: parentCartId,
        productId: new Types.ObjectId(productId),
      })
      .exec();
  }

  async deleteAllLinesForParent(parentCartId: string) {
    await this.model
      .deleteMany({ cartableType: CartableType.CART, cartableId: parentCartId })
      .exec();
  }

  async createLine(payload: {
    parentCartId: string;
    productId: Types.ObjectId;
    quantity: number;
    size: string;
    color: string;
    price: number;
    discount?: number;
  }): Promise<CartDocument> {
    return this.model.create({
      cartableType: CartableType.CART,
      cartableId: payload.parentCartId,
      productId: payload.productId,
      quantity: payload.quantity,
      size: payload.size,
      color: payload.color,
      price: payload.price,
      discount: payload.discount,
    });
  }
}
