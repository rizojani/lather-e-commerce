import { Injectable } from '@nestjs/common';
import { ListCategoriesAdminQueryDto } from '../dto/categories/list-categories-admin.categories.dto';
import { CategoryResource } from '../resources/category.resource';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(payload: { name: string; description?: string }) {
    return this.categoriesRepository.create(payload);
  }

  list() {
    return this.categoriesRepository.list();
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
