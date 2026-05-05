import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateAdminProductDto } from '../dto/products/create-admin-product.products.dto';
import { UpdateAdminProductDto } from '../dto/products/update-admin-product.products.dto';
import { ListAdminProductsQueryDto } from '../dto/products/list-admin-products.products.dto';
import { ProductListRequest } from '../dto/products/product-list.products.dto';
import { MediaOwnerType, MediaType } from '../schemas/media.schema';
import { ProductDocument } from '../schemas/product.schema';
import { ProductResource } from '../resources/product.resource';
import { Gender } from '../common/types/product.enum';
import { normalizeProductMediaRefs } from '../common/utils/product-media-refs';
import { InventoryStatus, ProductListingStatus } from '../common/types/product-admin.enum';
import { CategoriesService } from './categories.service';
import { MediaService } from './media.service';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly mediaService: MediaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private assertValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }
  }

  private async toProductDetailResource(populated: ProductDocument) {
    const plain = populated.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    const mediaIds = normalizeProductMediaRefs(populated.media as unknown[]);
    plain.media = mediaIds.length ? await this.mediaService.findByIdsOrdered(mediaIds) : [];
    return ProductResource.adminDetail(plain);
  }

  async getDetailForAdmin(id: string) {
    this.assertValidObjectId(id);
    const populated = await this.productsRepository.findByIdWithRelations(id);
    if (!populated) {
      throw new NotFoundException('Product not found');
    }
    return this.toProductDetailResource(populated);
  }

  /** Public storefront detail; inactive products are not exposed. */
  async getDetailForUser(id: string) {
    this.assertValidObjectId(id);
    const populated = await this.productsRepository.findByIdWithRelations(id);
    if (!populated) {
      throw new NotFoundException('Product not found');
    }
    const status = populated.status ?? ProductListingStatus.ACTIVE;
    if (status === ProductListingStatus.INACTIVE) {
      throw new NotFoundException('Product not found');
    }
    return this.toProductDetailResource(populated);
  }

  async createFromAdmin(dto: CreateAdminProductDto, files: Express.Multer.File[]) {
    const salePrice =
      dto.hasDiscount && dto.discountInPercentage != null && dto.discountInPercentage > 0
        ? Math.round(dto.price * (100 - dto.discountInPercentage)) / 100
        : undefined;

    const stock = dto.inventoryStatus === InventoryStatus.IN_STOCK ? 999 : 0;

    const product = await this.productsRepository.create({
      title: dto.title,
      name: dto.title,
      description: dto.description,
      category: dto.categoryId as never,
      inventoryStatus: dto.inventoryStatus,
      status: dto.status,
      price: dto.price,
      hasDiscount: dto.hasDiscount,
      discountInPercentage: dto.hasDiscount ? dto.discountInPercentage : undefined,
      salePrice: dto.hasDiscount ? salePrice : undefined,
      gender: Gender.UNISEX,
      sizes: [],
      colors: [],
      stock,
      media: [],
      averageRating: 0,
      reviewCount: 0,
    });

    const newMedia = await Promise.all(
      files.map((file) =>
        this.mediaService.create({
          file,
          modelType: MediaOwnerType.PRODUCT,
          modelId: product.id,
          type: MediaType.PRODUCT,
        }),
      ),
    );
    for (const m of newMedia) {
      product.media.push(m._id);
    }
    await product.save();

    const populated = await this.productsRepository.findByIdWithRelations(String(product._id));
    if (!populated) {
      throw new NotFoundException('Product not found after create');
    }
    const plain = populated.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    const mediaIds = product.media.map((id) => String(id));
    if (mediaIds.length > 0) {
      plain.media = await this.mediaService.findByIdsOrdered(mediaIds);
    }
    return ProductResource.adminDetail(plain);
  }

  async listAdminPaginated(query: ListAdminProductsQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limitRaw = query.limit && query.limit > 0 ? query.limit : 10;
    const limit = Math.min(limitRaw, 100);
    const search = query.search?.trim() || undefined;

    let searchCategoryIds: Types.ObjectId[] = [];
    if (search) {
      const rows = await this.categoriesService.findCategoryIdsByNameSearch(search);
      searchCategoryIds = rows.map((r) => r._id);
    }

    const filterCategoryIds =
      query.categoryIds?.map((id) => new Types.ObjectId(id)) ?? [];

    return this.productsRepository.listAdminPaginated({
      page,
      limit,
      search,
      searchCategoryIds,
      filterCategoryIds,
      status: query.status,
      inventoryStatus: query.inventoryStatus,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });
  }

  list(query: ProductListRequest) {
    return this.productsRepository.list(query);
  }

  latest() {
    return this.productsRepository.latest();
  }

  onSale() {
    return this.productsRepository.onSale();
  }

  popular() {
    return this.productsRepository.popular();
  }

  async updateFromAdmin(id: string, dto: UpdateAdminProductDto, files: Express.Multer.File[]) {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const deleteIds = dto.deleteMediaIds ?? [];
    const deleteSet = new Set(deleteIds.map((x) => String(x)));
    const owned = new Set(product.media.map((m) => String(m)));
    const idsToDelete = deleteIds.filter((mid) => owned.has(String(mid)));
    if (idsToDelete.length > 0) {
      await this.mediaService.deleteByIds(idsToDelete);
      product.media = product.media.filter((mid) => !deleteSet.has(String(mid))) as typeof product.media;
    }

    if (dto.categoryId !== undefined) {
      product.category = new Types.ObjectId(dto.categoryId) as never;
    }
    if (dto.title !== undefined) {
      product.title = dto.title;
      product.name = dto.title;
    }
    if (dto.description !== undefined) {
      product.description = dto.description;
    }
    if (dto.inventoryStatus !== undefined) {
      product.inventoryStatus = dto.inventoryStatus;
      product.stock = dto.inventoryStatus === InventoryStatus.IN_STOCK ? 999 : 0;
    }
    if (dto.status !== undefined) {
      product.status = dto.status;
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    const hasDiscount =
      dto.hasDiscount !== undefined ? dto.hasDiscount : (product.hasDiscount ?? false);
    const discountInPercentage =
      dto.discountInPercentage !== undefined
        ? dto.discountInPercentage
        : product.discountInPercentage;
    const price = dto.price !== undefined ? dto.price : product.price;

    product.hasDiscount = hasDiscount;
    product.discountInPercentage = hasDiscount ? discountInPercentage : undefined;

    const salePrice =
      hasDiscount && discountInPercentage != null && discountInPercentage > 0
        ? Math.round(price * (100 - discountInPercentage)) / 100
        : undefined;
    product.salePrice = hasDiscount ? salePrice : undefined;

    const newMedia = await Promise.all(
      files.map((file) =>
        this.mediaService.create({
          file,
          modelType: MediaOwnerType.PRODUCT,
          modelId: product.id,
          type: MediaType.PRODUCT,
        }),
      ),
    );
    for (const m of newMedia) {
      product.media.push(m._id);
    }

    await product.save();

    const populated = await this.productsRepository.findByIdWithRelations(String(product._id));
    if (!populated) {
      throw new NotFoundException('Product not found after update');
    }
    const plain = populated.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    const mediaIds = product.media.map((mid) => String(mid));
    plain.media =
      mediaIds.length > 0 ? await this.mediaService.findByIdsOrdered(mediaIds) : [];
    return ProductResource.adminDetail(plain);
  }

  async delete(id: string) {
    const deleted = await this.productsRepository.delete(id);
    if (!deleted) throw new NotFoundException('Product not found');
    return { message: 'Deleted successfully' };
  }
}
