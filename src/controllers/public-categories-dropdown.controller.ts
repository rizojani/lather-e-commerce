import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CategoryResource } from '../resources/category.resource';
import { CategoriesService } from '../services/categories.service';

@Controller('categories-dropdown')
@ApiTags('Public - Categories')
export class PublicCategoriesDropdownController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Category tree (same as GET /categories)' })
  @ResponseMessage('Categories fetched successfully')
  async tree() {
    const roots = await this.categoriesService.listPublicCategoryTree();
    return CategoryResource.tree(roots as Array<Record<string, unknown>>);
  }
}
