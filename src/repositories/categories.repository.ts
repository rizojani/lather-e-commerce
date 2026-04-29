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

  list() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }
}
