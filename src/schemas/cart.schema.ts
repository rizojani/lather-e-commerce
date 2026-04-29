import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop()
  sessionId?: string;

  @Prop({ type: [CartItem], default: [] })
  items!: CartItem[];

  @Prop({ default: 0 })
  subtotal!: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ user: 1 }, { unique: true, sparse: true });
CartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
