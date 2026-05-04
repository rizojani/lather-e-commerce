import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { escapeRegex } from '../common/utils/escape-regex';
import { ProductListingStatus } from '../common/types/product-admin.enum';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoriesRepository {
  constructor(@InjectModel(Category.name) private readonly model: Model<CategoryDocument>) {}

  create(payload: Partial<Category>) {
    return this.model.create(payload);
  }

  async upsertDefaults(names: string[]) {
    await Promise.all(
      names.map((name) =>
        this.model.updateOne(
          { name },
          {
            $setOnInsert: {
              name,
              description: `${name} category`,
              status: ProductListingStatus.ACTIVE,
            },
          },
          { upsert: true },
        ),
      ),
    );
  }

  list() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async listPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items, total, page, limit };
  }

  /** Category ids whose name matches search (for admin product list search). */
  /** Active categories A→Z by display name (`name`), for public dropdowns. */
  findActiveForDropdown() {
    return this.model
      .find({
        $or: [{ status: ProductListingStatus.ACTIVE }, { status: { $exists: false } }],
      })
      .sort({ name: 1 })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();
  }

  findIdsByNameSearch(search: string): Promise<Array<{ _id: Types.ObjectId }>> {
    const trimmed = search.trim();
    if (!trimmed) {
      return Promise.resolve([]);
    }
    const pattern = new RegExp(escapeRegex(trimmed), 'i');
    return this.model.find({ name: pattern }).select('_id').lean().exec() as Promise<Array<{ _id: Types.ObjectId }>>;
  }
}
