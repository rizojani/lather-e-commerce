import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { CreateProductRequest } from '../dto/products/create-product.products.dto';
import { ProductsService } from '../services/products.service';

@Controller('admin/products')
@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(@Body() payload: CreateProductRequest) {
    return this.productsService.create(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product by id' })
  update(@Param('id') id: string, @Body() payload: Partial<CreateProductRequest>) {
    return this.productsService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id' })
  remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
