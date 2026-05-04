import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { escapeRegex } from '../common/utils/escape-regex';
import { InventoryStatus, ProductListingStatus } from '../common/types/product-admin.enum';
import { Media } from '../schemas/media.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { ProductListRequest } from '../dto/products/product-list.products.dto';

export interface AdminProductListParams {
  page: number;
  limit: number;
  search?: string;
  /** Category ids matched by category name (used inside search `$or`). */
  searchCategoryIds: Types.ObjectId[];
  /** Restrict products to these category ids (AND with other filters). */
  filterCategoryIds: Types.ObjectId[];
  status?: ProductListingStatus;
  inventoryStatus?: InventoryStatus;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class ProductsRepository {
  constructor(@InjectModel(Product.name) private readonly model: Model<ProductDocument>) {}

  create(payload: Partial<Product>) {
    return this.model.create(payload);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByIdWithRelations(id: string) {
    return this.model
      .findById(id)
      .populate('category')
      .populate({ path: 'media', model: Media.name })
      .exec();
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

    return this.model
      .find(filters)
      .sort(sort)
      .populate('category')
      .populate({ path: 'media', model: Media.name })
      .exec();
  }

  latest() {
    return this.model
      .find()
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('category')
      .populate({ path: 'media', model: Media.name })
      .exec();
  }

  onSale() {
    return this.model
      .find({ salePrice: { $exists: true, $gt: 0 }, $expr: { $lt: ['$salePrice', '$price'] } })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('category')
      .populate({ path: 'media', model: Media.name })
      .exec();
  }

  popular() {
    return this.model
      .find()
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(12)
      .populate('category')
      .populate({ path: 'media', model: Media.name })
      .exec();
  }

  async listAdminPaginated(params: AdminProductListParams) {
    const {
      page,
      limit,
      search,
      searchCategoryIds,
      filterCategoryIds,
      status,
      inventoryStatus,
      fromDate,
      toDate,
    } = params;
    const skip = (page - 1) * limit;
    const filter: FilterQuery<ProductDocument> = {};

    if (filterCategoryIds.length > 0) {
      filter.category = { $in: filterCategoryIds };
    }

    if (status !== undefined) {
      filter.status = status;
    }
    if (inventoryStatus !== undefined) {
      filter.inventoryStatus = inventoryStatus;
    }

    const createdRange: { $gte?: Date; $lte?: Date } = {};
    if (fromDate) {
      const d = new Date(fromDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(0, 0, 0, 0);
        createdRange.$gte = d;
      }
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        createdRange.$lte = d;
      }
    }
    if (Object.keys(createdRange).length > 0) {
      if (createdRange.$gte && createdRange.$lte && createdRange.$gte > createdRange.$lte) {
        const t = createdRange.$gte;
        createdRange.$gte = createdRange.$lte;
        createdRange.$lte = t;
      }
      filter.createdAt = createdRange;
    }

    if (search) {
      const safe = escapeRegex(search);
      const rx = new RegExp(safe, 'i');
      const orClause: FilterQuery<ProductDocument>[] = [{ title: rx }, { name: rx }];
      if (searchCategoryIds.length > 0) {
        orClause.push({ category: { $in: searchCategoryIds } });
      }
      filter.$or = orClause;
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .select('-media')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }
}
