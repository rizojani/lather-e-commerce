import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
@ApiTags('User - Categories')
export class UserCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  list() {
    return this.categoriesService.list();
  }
}
