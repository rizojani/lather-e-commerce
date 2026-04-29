import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductResource } from '../resources/product.resource';
import { ProductListRequest } from '../dto/products/product-list.products.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
@ApiTags('User - Products')
export class UserProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  @ApiQuery({ name: 'gender', required: false, example: 'unisex' })
  @ApiQuery({ name: 'category', required: false, example: 'Skincare' })
  @ApiQuery({ name: 'size', required: false, example: 'M' })
  @ApiQuery({ name: 'color', required: false, example: 'Black' })
  @ApiQuery({ name: 'price', required: false, example: 'low_to_high' })
  @ApiQuery({ name: 'sort', required: false, example: 'desc' })
  async list(@Query() query: ProductListRequest) {
    const products = await this.productsService.list(query);
    return ProductResource.collection(products as unknown as Array<Record<string, unknown>>);
  }

  @Get('latest')
  @ApiOperation({ summary: 'List latest products' })
  async latest() {
    return ProductResource.collection((await this.productsService.latest()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('sale')
  @ApiOperation({ summary: 'List sale products' })
  async onSale() {
    return ProductResource.collection((await this.productsService.onSale()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('popular')
  @ApiOperation({ summary: 'List popular products' })
  async popular() {
    return ProductResource.collection((await this.productsService.popular()) as unknown as Array<Record<string, unknown>>);
  }
}
