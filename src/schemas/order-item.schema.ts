import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

/** Child rows: created after the parent `Order` exists (`orderId`). */
@Schema({ collection: 'orderItems', timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  /** Effective unit price after line discount (matches cart math). */
  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ default: '' })
  size!: string;

  @Prop({ default: '' })
  color!: string;

  /** List/catalog unit price at checkout (before `discount` %), same as cart `price`. */
  @Prop({ min: 0 })
  price?: number;

  /** Line discount percent 0–100 at checkout; same as cart `discount`. */
  @Prop({ min: 0, max: 100 })
  discount?: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
OrderItemSchema.index({ orderId: 1, createdAt: 1 });
