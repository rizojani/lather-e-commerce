import { Injectable } from '@nestjs/common';
import { WEARABLE_CATEGORIES } from '../common/types/category.enum';
import { ListCategoriesAdminQueryDto } from '../dto/categories/list-categories-admin.categories.dto';
import { CategoryResource } from '../resources/category.resource';
import { CategoriesRepository } from '../repositories/categories.repository';
import { ProductListingStatus } from '../common/types/product-admin.enum';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(payload: { name: string; description?: string }) {
    const name = payload.name.trim();
    const slug = slugify(name);
    const title = name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name;
    return this.categoriesRepository.create({
      categoryableType: null,
      categoryableId: null,
      name,
      slug,
      title,
      description: payload.description ?? '',
      image: null,
      featured: false,
      sortOrder: 0,
      seoTitle: '',
      seoDescription: '',
      status: ProductListingStatus.ACTIVE,
      deletedAt: null,
    });
  }

  migrateCategories() {
    return this.categoriesRepository.migrateCategoryCollection();
  }

  truncateAndSeedCategories() {
    return this.categoriesRepository.truncateAndSeedGenderTree();
  }

  /** Idempotent: ensures default wearable root categories exist (no truncate). */
  seedWearableRoots() {
    return this.categoriesRepository.upsertDefaults(WEARABLE_CATEGORIES);
  }

  /** Clears categories, runs migration/index sync, re-seeds flat wearable roots (pre–gender-tree style). */
  async resetDevCategoryData() {
    await this.categoriesRepository.clearAllCategories();
    await this.categoriesRepository.migrateCategoryCollection();
    await this.categoriesRepository.upsertDefaults(WEARABLE_CATEGORIES);
  }

  clearAllCategories() {
    return this.categoriesRepository.clearAllCategories();
  }

  listPublicCategoryTree() {
    return this.categoriesRepository.listPublicRootTree();
  }

  list() {
    return this.listPublicCategoryTree();
  }

  async listActiveForDropdown() {
    const rows = await this.categoriesRepository.findActiveForDropdown();
    return CategoryResource.dropdown(rows as unknown as Array<Record<string, unknown>>);
  }

  listPaginatedAdmin(query: ListCategoriesAdminQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limitRaw = query.limit && query.limit > 0 ? query.limit : 10;
    const limit = Math.min(limitRaw, 100);
    return this.categoriesRepository.listPaginated(page, limit);
  }

  findCategoryIdsByNameSearch(search: string) {
    const q = search.trim();
    if (!q) {
      return Promise.resolve([]);
    }
    return this.categoriesRepository.findIdsByNameSearch(q);
  }
}
