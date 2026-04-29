import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { UpdateCartRequest } from '../dto/cart/update-cart.cart.dto';

interface CartOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async getCart(owner: CartOwner) {
    this.assertOwner(owner);
    const cart = await this.cartRepository.findByOwner(owner);
    return cart ?? { user: owner.userId, sessionId: owner.sessionId, items: [], subtotal: 0 };
  }

  async addOrUpdate(owner: CartOwner, payload: UpdateCartRequest) {
    this.assertOwner(owner);
    const product = await this.productsRepository.findById(payload.productId);
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.getCart(owner);
    const items = [...(cart.items ?? [])];
    const index = items.findIndex((item) => String(item.product) === payload.productId);
    const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;

    if (index >= 0) {
      items[index] = { ...items[index], quantity: payload.quantity, unitPrice };
    } else {
      items.push({ product: product._id, quantity: payload.quantity, unitPrice });
    }

    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
    return this.cartRepository.upsertByOwner(owner, {
      user: owner.userId as never,
      sessionId: owner.sessionId,
      items,
      subtotal,
    });
  }

  async remove(owner: CartOwner, productId: string) {
    this.assertOwner(owner);
    const cart = await this.getCart(owner);
    const items = (cart.items ?? []).filter((item) => String(item.product) !== productId);
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
    return this.cartRepository.upsertByOwner(owner, {
      user: owner.userId as never,
      sessionId: owner.sessionId,
      items,
      subtotal,
    });
  }

  private assertOwner(owner: CartOwner) {
    if (!owner.userId && !owner.sessionId) {
      throw new BadRequestException('Authorization token or sessionId header is required');
    }
  }
}
