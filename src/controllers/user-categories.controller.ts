import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
@ApiTags('User - Categories')
export class UserCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ResponseMessage('Categories fetched successfully')
  list() {
    return this.categoriesService.list();
  }
}
