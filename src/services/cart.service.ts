import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { UpdateCartRequest } from '../dto/cart/update-cart.cart.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async getCart(userId: string) {
    const cart = await this.cartRepository.findByUser(userId);
    return cart ?? { user: userId, items: [], subtotal: 0 };
  }

  async addOrUpdate(userId: string, payload: UpdateCartRequest) {
    const product = await this.productsRepository.findById(payload.productId);
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.getCart(userId);
    const items = [...(cart.items ?? [])];
    const index = items.findIndex((item) => String(item.product) === payload.productId);
    const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;

    if (index >= 0) {
      items[index] = { ...items[index], quantity: payload.quantity, unitPrice };
    } else {
      items.push({ product: product._id, quantity: payload.quantity, unitPrice });
    }

    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
    return this.cartRepository.upsertByUser(userId, { user: userId as never, items, subtotal });
  }

  async remove(userId: string, productId: string) {
    const cart = await this.getCart(userId);
    const items = (cart.items ?? []).filter((item) => String(item.product) !== productId);
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
    return this.cartRepository.upsertByUser(userId, { user: userId as never, items, subtotal });
  }
}
