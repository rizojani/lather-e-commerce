import { Injectable, BadRequestException } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { OrdersRepository } from '../repositories/orders.repository';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';

@Injectable()
export class OrdersService {
  private readonly taxRate = 0.08;
  private readonly flatDeliveryCharge = 120;

  constructor(
    private readonly cartService: CartService,
    private readonly cartRepository: CartRepository,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async placeOrder(userId: string, payload: PlaceOrderRequest) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.subtotal;
    const tax = Number((subtotal * this.taxRate).toFixed(2));
    const deliveryCharge = subtotal > 3000 ? 0 : this.flatDeliveryCharge;
    const total = subtotal + tax + deliveryCharge;

    const order = await this.ordersRepository.create({
      user: userId as never,
      items: cart.items,
      paymentMethod: payload.paymentMethod,
      subtotal,
      tax,
      deliveryCharge,
      total,
      status: 'placed',
    });

    await this.cartRepository.upsertByUser(userId, { user: userId as never, items: [], subtotal: 0 });
    return order;
  }

  myOrders(userId: string) {
    return this.ordersRepository.findByUser(userId);
  }

  listAll() {
    return this.ordersRepository.listAll();
  }

  trendingCurrentYear() {
    return this.ordersRepository.trendingCurrentYear();
  }
}
