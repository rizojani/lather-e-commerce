import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductRequest } from '../dto/products/create-product.products.dto';
import { ProductListRequest } from '../dto/products/product-list.products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  create(payload: CreateProductRequest) {
    return this.productsRepository.create({
      ...payload,
      category: payload.category as never,
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

  async update(id: string, payload: Partial<CreateProductRequest>) {
    const product = await this.productsRepository.update(id, {
      ...payload,
      category: payload.category as never,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async delete(id: string) {
    const deleted = await this.productsRepository.delete(id);
    if (!deleted) throw new NotFoundException('Product not found');
    return { message: 'Deleted successfully' };
  }
}
