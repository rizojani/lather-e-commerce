import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProductListingStatus } from '../common/types/product-admin.enum';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ enum: ProductListingStatus, default: ProductListingStatus.ACTIVE })
  status!: ProductListingStatus;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
