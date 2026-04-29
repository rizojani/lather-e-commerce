import { Injectable, BadRequestException } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { OrdersRepository } from '../repositories/orders.repository';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { OrderStatus } from '../schemas/order.schema';
import { AddressesService } from './addresses.service';
import { PaymentLogsService } from './payment-logs.service';

interface OrderOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class OrdersService {
  private readonly taxRate = 0.08;
  private readonly flatDeliveryCharge = 120;

  constructor(
    private readonly cartService: CartService,
    private readonly cartRepository: CartRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly addressesService: AddressesService,
    private readonly paymentLogsService: PaymentLogsService,
  ) {}

  async placeOrder(owner: OrderOwner, payload: PlaceOrderRequest) {
    this.assertOwner(owner);
    const cart = await this.cartService.getCart(owner);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.subtotal;
    const tax = Number((subtotal * this.taxRate).toFixed(2));
    const deliveryCharge = subtotal > 3000 ? 0 : this.flatDeliveryCharge;
    const total = subtotal + tax + deliveryCharge;

    const order = await this.ordersRepository.create({
      user: owner.userId as never,
      sessionId: owner.sessionId,
      items: cart.items,
      paymentMethod: payload.paymentMethod,
      subtotal,
      tax,
      deliveryCharge,
      total,
      status: OrderStatus.CREATED,
    });

    await this.addressesService.createOrderAddresses(order.id, {
      contactInfo: payload.contactInfo,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress,
    });

    await this.paymentLogsService.createOrderPaymentLog(order.id, total, payload.paymentMethod);

    await this.cartRepository.upsertByOwner(owner, {
      user: owner.userId as never,
      sessionId: owner.sessionId,
      items: [],
      subtotal: 0,
    });
    return order;
  }

  myOrders(owner: OrderOwner) {
    this.assertOwner(owner);
    return this.ordersRepository.findByOwner(owner);
  }

  listAll() {
    return this.ordersRepository.listAll();
  }

  trendingCurrentYear() {
    return this.ordersRepository.trendingCurrentYear();
  }

  private assertOwner(owner: OrderOwner) {
    if (!owner.userId && !owner.sessionId) {
      throw new BadRequestException('Authorization token or sessionId header is required');
    }
  }
}
