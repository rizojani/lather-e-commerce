import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { ProductListRequest } from '../dto/products/product-list.products.dto';

@Injectable()
export class ProductsRepository {
  constructor(@InjectModel(Product.name) private readonly model: Model<ProductDocument>) {}

  create(payload: Partial<Product>) {
    return this.model.create(payload);
  }

  findById(id: string) {
    return this.model.findById(id).populate('category').exec();
  }

  update(id: string, payload: Partial<Product>) {
    return this.model.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  list(query: ProductListRequest) {
    const filters: FilterQuery<ProductDocument> = {};

    if (query.gender) filters.gender = query.gender;
    if (query.category) filters.category = query.category;
    if (query.size) filters.sizes = { $in: [query.size] };
    if (query.color) filters.colors = { $in: [query.color] };

    const sort: Record<string, SortOrder> = {};
    if (query.price) {
      sort.price = query.price === 'low_to_high' ? 1 : -1;
    } else {
      sort.createdAt = query.sort === 'asc' ? 1 : -1;
    }

    return this.model.find(filters).sort(sort).populate('category').exec();
  }

  latest() {
    return this.model.find().sort({ createdAt: -1 }).limit(12).exec();
  }

  onSale() {
    return this.model
      .find({ salePrice: { $exists: true, $gt: 0 }, $expr: { $lt: ['$salePrice', '$price'] } })
      .sort({ createdAt: -1 })
      .limit(12)
      .exec();
  }

  popular() {
    return this.model.find().sort({ averageRating: -1, reviewCount: -1 }).limit(12).exec();
  }
}
