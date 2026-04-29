import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from './order.schema';

export type PaymentLogDocument = HydratedDocument<PaymentLog>;

export enum PaymentLogOwnerType {
  ORDER = 'Order',
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

@Schema({ timestamps: true })
export class PaymentLog {
  @Prop({ enum: PaymentLogOwnerType, required: true })
  modelType!: PaymentLogOwnerType;

  @Prop({ type: Types.ObjectId, required: true })
  modelId!: Types.ObjectId;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod!: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  status!: PaymentStatus;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop()
  transactionId?: string;
}

export const PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);
PaymentLogSchema.index({ modelType: 1, modelId: 1 });
