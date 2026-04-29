import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

export enum MediaOwnerType {
  USER = 'User',
  PRODUCT = 'Product',
}

export enum MediaType {
  PROFILE = 'profile',
  PRODUCT = 'product',
}

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  path!: string;

  @Prop({ enum: MediaType, required: true })
  type!: MediaType;

  @Prop({ enum: MediaOwnerType, required: true })
  modelType!: MediaOwnerType;

  @Prop({ type: Types.ObjectId, required: true })
  modelId!: Types.ObjectId;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
MediaSchema.index({ modelType: 1, modelId: 1, type: 1 });
