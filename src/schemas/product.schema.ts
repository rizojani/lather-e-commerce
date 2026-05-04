import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Gender } from '../common/types/product.enum';
import { InventoryStatus, ProductListingStatus } from '../common/types/product-admin.enum';
import { Media } from './media.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  /** @deprecated use title; kept for older documents */
  @Prop()
  name?: string;

  @Prop()
  title?: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ enum: InventoryStatus, default: InventoryStatus.IN_STOCK })
  inventoryStatus!: InventoryStatus;

  @Prop({ enum: ProductListingStatus, default: ProductListingStatus.ACTIVE })
  status!: ProductListingStatus;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: false })
  hasDiscount!: boolean;

  @Prop({ min: 0, max: 100 })
  discountInPercentage?: number;

  @Prop({ enum: Gender, default: Gender.UNISEX })
  gender!: Gender;

  @Prop({ type: [String], default: [] })
  sizes!: string[];

  @Prop({ type: [String], default: [] })
  colors!: string[];

  @Prop({ min: 0 })
  salePrice?: number;

  @Prop({ min: 0, max: 5, default: 0 })
  averageRating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: Media.name }], default: [] })
  media!: Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
