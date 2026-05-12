import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Address, AddressOwnerType, AddressType } from './address.schema';

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
  REJECTED = 'rejected',
}

/** Order header only; line rows live in `OrderItem` (`orderItems` collection). */
@Schema({
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop()
  sessionId?: string;

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

  /** Set when status is `cancelled` or `rejected` (admin update). */
  @Prop()
  statusReason?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

/** Polymorphic relation: Address rows with modelType='Order' + modelId=order._id, filtered by type. */
OrderSchema.virtual('contactInfo', {
  ref: Address.name,
  localField: '_id',
  foreignField: 'modelId',
  justOne: true,
  match: { modelType: AddressOwnerType.ORDER, type: AddressType.CONTACT },
});

OrderSchema.virtual('shippingAddress', {
  ref: Address.name,
  localField: '_id',
  foreignField: 'modelId',
  justOne: true,
  match: { modelType: AddressOwnerType.ORDER, type: AddressType.SHIPPING },
});

OrderSchema.virtual('billingAddress', {
  ref: Address.name,
  localField: '_id',
  foreignField: 'modelId',
  justOne: true,
  match: { modelType: AddressOwnerType.ORDER, type: AddressType.BILLING },
});
