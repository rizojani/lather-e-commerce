import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { WEARABLE_CATEGORIES } from '../common/types/category.enum';
import { Role } from '../common/types/roles.enum';
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
  create(@Body() payload: { name: string; description?: string }) {
    return this.categoriesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'List categories' })
  list() {
    return this.categoriesService.list();
  }
}
