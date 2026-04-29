import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
export class UserCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.list();
  }
}
