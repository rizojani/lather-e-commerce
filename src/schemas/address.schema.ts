import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

export enum AddressOwnerType {
  USER = 'User',
  ORDER = 'Order',
}

export enum AddressType {
  CONTACT = 'contact',
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

@Schema({ timestamps: true })
export class Address {
  @Prop({ enum: AddressOwnerType, required: true })
  modelType!: AddressOwnerType;

  @Prop({ type: Types.ObjectId, required: true })
  modelId!: Types.ObjectId;

  @Prop({ enum: AddressType, required: true })
  type!: AddressType;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  addressLine1!: string;

  @Prop()
  addressLine2?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ required: true })
  postalCode!: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
AddressSchema.index({ modelType: 1, modelId: 1, type: 1 });
