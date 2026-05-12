import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { WEARABLE_CATEGORIES } from '../common/types/category.enum';
import { Role } from '../common/types/roles.enum';
import { ListCategoriesAdminQueryDto } from '../dto/categories/list-categories-admin.categories.dto';
import { CategoryResource } from '../resources/category.resource';
import { CategoriesService } from '../services/categories.service';

@Controller('admin/categories')
@ApiTags('Admin - Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiBody({
    schema: {
      example: {
        name: WEARABLE_CATEGORIES[0],
        description: 'Optional description',
      },
    },
  })
  @ResponseMessage('Category created successfully')
  async create(@Body() payload: { name: string; description?: string }) {
    const category = await this.categoriesService.create(payload);
    return CategoryResource.one(category as unknown as Record<string, unknown>);
  }

  @Get()
  @ApiOperation({ summary: 'List categories (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Page size 1–100 (default 10)' })
  @ResponseMessage('Categories fetched successfully')
  async list(@Query() query: ListCategoriesAdminQueryDto) {
    const { items, total, page, limit } = await this.categoriesService.listPaginatedAdmin(query);
    return {
      items: CategoryResource.collection(items as unknown as Array<Record<string, unknown>>),
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
