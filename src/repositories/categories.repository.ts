import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
}
