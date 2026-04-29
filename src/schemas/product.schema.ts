import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Gender } from '../common/types/product.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ enum: Gender, required: true })
  gender!: Gender;

  @Prop({ type: [String], default: [] })
  sizes!: string[];

  @Prop({ type: [String], default: [] })
  colors!: string[];

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ min: 0 })
  salePrice?: number;

  @Prop({ min: 0, max: 5, default: 0 })
  averageRating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({ default: 0 })
  stock!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
