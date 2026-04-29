import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum PaymentMethod {
  ONLINE = 'online',
  COD = 'cod',
  STRIPE = 'stripe',
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
}

export enum OrderStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  unitPrice!: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop()
  sessionId?: string;

  @Prop({ type: [OrderItem], default: [] })
  items!: OrderItem[];

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod!: PaymentMethod;

  @Prop({ default: 0 })
  subtotal!: number;

  @Prop({ default: 0 })
  tax!: number;

  @Prop({ default: 0 })
  deliveryCharge!: number;

  @Prop({ default: 0 })
  total!: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.CREATED })
  status!: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
