import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { multerConfig } from '../config/multer.config';
import { Role } from '../common/types/roles.enum';
import { CreateAdminProductDto } from '../dto/products/create-admin-product.products.dto';
import { ListAdminProductsQueryDto } from '../dto/products/list-admin-products.products.dto';
import { UpdateAdminProductDto } from '../dto/products/update-admin-product.products.dto';
import { ProductResource } from '../resources/product.resource';
import { ProductsService } from '../services/products.service';

@Controller('admin/products')
@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products (paginated, optional filters)',
    description: 'Does not include `medias` or load media relations. Use product create/detail flows for media.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    description:
      'Optional. Use `categoryIds[0]=id1&categoryIds[1]=id2`, repeat `categoryIds=`, comma-separated, or JSON array. Products in any listed category.',
    isArray: true,
  })
  @ApiQuery({ name: 'search', required: false, description: 'Title, legacy name, or category name' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'inventoryStatus', required: false, enum: ['in-stock', 'out-of-stock'] })
  @ApiQuery({ name: 'fromDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'toDate', required: false, example: '2025-12-31' })
  @ResponseMessage('Products fetched successfully')
  async list(@Query() query: ListAdminProductsQueryDto) {
    const { items, total, page, limit } = await this.productsService.listAdminPaginated(query);
    return {
      items: ProductResource.collectionAdminList(items as unknown as Array<Record<string, unknown>>),
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create product (multipart: fields + medias files)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('medias', 25, multerConfig))
  @ApiBody({
    description: 'Text fields plus repeated file field `medias` (images or videos)',
    schema: {
      type: 'object',
      required: [
        'categoryId',
        'title',
        'description',
        'inventoryStatus',
        'status',
        'price',
        'hasDiscount',
      ],
      properties: {
        categoryId: { type: 'string', example: '64f18f7a2fb4f8a12b0d1111' },
        title: { type: 'string', example: 'Summer jacket' },
        description: { type: 'string', example: '<p>HTML description</p>' },
        inventoryStatus: { type: 'string', enum: ['in-stock', 'out-of-stock'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
        price: { type: 'number', example: 99.99 },
        hasDiscount: { type: 'boolean', example: false },
        discountInPercentage: { type: 'number', example: 15, description: '0–100 when hasDiscount is true' },
        medias: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ResponseMessage('Product created successfully')
  create(
    @Body() payload: CreateAdminProductDto,
    @UploadedFiles() medias?: Express.Multer.File[],
  ) {
    return this.productsService.createFromAdmin(payload, medias ?? []);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product detail',
    description: 'Same shape as create/update: category + full medias. Includes inactive products.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB id' })
  @ResponseMessage('Product fetched successfully')
  getOne(@Param('id') id: string) {
    return this.productsService.getDetailForAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product (multipart, same fields as create — all optional)',
    description:
      'Send only fields to change. Optional `medias` files append. `deleteMediaIds`: array of media Mongo ids that belong to this product (removed from DB and disk). Response matches create (`ProductResource.adminDetail`).',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('medias', 25, multerConfig))
  @ApiBody({
    description: 'All fields optional. Include `deleteMediaIds` as JSON array string or bracket keys.',
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        inventoryStatus: { type: 'string', enum: ['in-stock', 'out-of-stock'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
        price: { type: 'number' },
        hasDiscount: { type: 'boolean' },
        discountInPercentage: { type: 'number' },
        deleteMediaIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ids of product media rows to delete',
        },
        medias: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ResponseMessage('Product updated successfully')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateAdminProductDto,
    @UploadedFiles() medias?: Express.Multer.File[],
  ) {
    return this.productsService.updateFromAdmin(id, payload, medias ?? []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id' })
  @ResponseMessage('Product deleted successfully')
  remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
