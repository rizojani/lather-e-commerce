import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ProductResource } from '../resources/product.resource';
import { ProductListRequest } from '../dto/products/product-list.products.dto';
import { Gender } from '../common/types/product.enum';
import { ProductsService } from '../services/products.service';

@Controller('products')
@ApiTags('User - Products')
export class UserProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  @ApiQuery({
    name: 'gender',
    required: false,
    enum: Gender,
    example: Gender.UNISEX,
    description:
      'Filters by product `gender` (`men`, `women`, `unisex` only). Kids ranges are not a gender value here — use category filters / category tree instead.',
  })
  @ApiQuery({ name: 'category', required: false, example: 'Skincare' })
  @ApiQuery({ name: 'size', required: false, example: 'M' })
  @ApiQuery({ name: 'color', required: false, example: 'Black' })
  @ApiQuery({ name: 'price', required: false, example: 'low_to_high' })
  @ApiQuery({ name: 'sort', required: false, example: 'desc' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 24 })
  @ResponseMessage('Products fetched successfully')
  async list(@Query() query: ProductListRequest) {
    const products = await this.productsService.list(query);
    return ProductResource.collection(products as unknown as Array<Record<string, unknown>>);
  }

  @Get('latest')
  @ApiOperation({ summary: 'List latest products' })
  @ResponseMessage('Latest products fetched successfully')
  async latest() {
    return ProductResource.collection((await this.productsService.latest()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('sale')
  @ApiOperation({ summary: 'List sale products' })
  @ResponseMessage('Sale products fetched successfully')
  async onSale() {
    return ProductResource.collection((await this.productsService.onSale()) as unknown as Array<Record<string, unknown>>);
  }

  @Get('popular')
  @ApiOperation({ summary: 'List popular products' })
  @ResponseMessage('Popular products fetched successfully')
  async popular() {
    return ProductResource.collection((await this.productsService.popular()) as unknown as Array<Record<string, unknown>>);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id (storefront; inactive returns 404)' })
  @ApiParam({ name: 'id', description: 'Product MongoDB id' })
  @ResponseMessage('Product fetched successfully')
  async getOne(@Param('id') id: string) {
    return this.productsService.getDetailForUser(id);
  }
}
