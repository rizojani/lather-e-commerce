import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum PaymentMethod {
  ONLINE = 'online',
  COD = 'cod',
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
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

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

  @Prop({ default: 'pending' })
  status!: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
