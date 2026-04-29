import { Controller, Get, Query } from '@nestjs/common';
import { ProductResource } from '../resources/product.resource';
import { ProductListRequest } from '../dto/products/product-list.products.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
export class UserProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(@Query() query: ProductListRequest) {
    const products = await this.productsService.list(query);
    return ProductResource.collection(products as unknown as Array<Record<string, unknown>>);
  }

  @Get('latest')
  async latest() {
    return ProductResource.collection((await this.productsService.latest()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('sale')
  async onSale() {
    return ProductResource.collection((await this.productsService.onSale()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('popular')
  async popular() {
    return ProductResource.collection((await this.productsService.popular()) as unknown as Array<Record<string, unknown>>);
  }
}
