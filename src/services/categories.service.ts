import { Injectable } from '@nestjs/common';
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
}
