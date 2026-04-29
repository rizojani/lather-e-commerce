import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { CreateProductRequest } from '../dto/products/create-product.products.dto';
import { ProductsService } from '../services/products.service';

@Controller('admin/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() payload: CreateProductRequest) {
    return this.productsService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: Partial<CreateProductRequest>) {
    return this.productsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
