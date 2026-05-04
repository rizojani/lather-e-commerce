import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

/** Parent cart row: one per logged-in user id or guest session id. */
export enum CartableType {
  USER = 'user',
  /** Line item row: belongs to a parent cart document (`cartableId` = parent `_id`). */
  CART = 'cart',
}

@Schema({ collection: 'carts', timestamps: true })
export class Cart {
  @Prop({ type: String, enum: Object.values(CartableType), required: true })
  cartableType!: CartableType;

  /** `user`: user Mongo id or guest `sessionId` string. `cart`: parent cart `_id` as string. */
  @Prop({ required: true })
  cartableId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ min: 1 })
  quantity?: number;

  @Prop({ default: '' })
  size!: string;

  @Prop({ default: '' })
  color!: string;

  /** Unit price snapshot at add/update time. */
  @Prop({ min: 0 })
  price?: number;

  /** Optional discount percentage 0–100 applied to `price` for line totals. */
  @Prop({ min: 0, max: 100 })
  discount?: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index(
  { cartableType: 1, cartableId: 1 },
  {
    unique: true,
    partialFilterExpression: { cartableType: CartableType.USER },
  },
);

CartSchema.index({ cartableType: 1, cartableId: 1 });
