import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CATEGORYABLE_TYPE_CATEGORY } from '../common/constants/category-morph.constants';
import { ProductListingStatus } from '../common/types/product-admin.enum';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category {
  @Prop({
    type: String,
    default: null,
    validate: {
      validator(v: unknown) {
        return v === null || v === undefined || v === CATEGORYABLE_TYPE_CATEGORY;
      },
      message: 'categoryableType must be null or "category"',
    },
  })
  categoryableType!: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  categoryableId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: String, default: null })
  image!: string | null;

  @Prop({ type: Boolean, default: false })
  featured!: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ default: '' })
  seoTitle!: string;

  @Prop({ default: '' })
  seoDescription!: string;

  @Prop({ enum: ProductListingStatus, default: ProductListingStatus.ACTIVE })
  status!: ProductListingStatus;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ name: 1 });
CategorySchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
CategorySchema.index({ categoryableType: 1, categoryableId: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ featured: 1 });
CategorySchema.index({ deletedAt: 1 });
CategorySchema.index({ categoryableId: 1, sortOrder: 1, name: 1 });

CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'categoryableId',
  match: { categoryableType: CATEGORYABLE_TYPE_CATEGORY, deletedAt: null },
  options: { sort: { sortOrder: 1, name: 1 } },
});

CategorySchema.pre('validate', function (next) {
  const type = this.categoryableType;
  const id = this.categoryableId;
  const idMissing = id === null || id === undefined;
  const typeMissing = type === null || type === undefined;
  const isRoot = typeMissing && idMissing;
  const isChild =
    type === CATEGORYABLE_TYPE_CATEGORY && !idMissing && Types.ObjectId.isValid(String(id));
  if (isRoot) {
    this.categoryableType = null;
    this.categoryableId = null;
    return next();
  }
  if (isChild) {
    if (this._id && id && this._id.equals(id)) {
      return next(new Error('Category cannot reference itself as parent'));
    }
    return next();
  }
  next(
    new Error(
      'Invalid category morph: roots require null type and id; children require categoryableType "category" and categoryableId',
    ),
  );
});
