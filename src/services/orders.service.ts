import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { effectiveUnitPrice, lineSubtotal } from '../common/utils/cart-line-price';
import { CartRepository } from '../repositories/cart.repository';
import { OrdersRepository } from '../repositories/orders.repository';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { OrderStatus } from '../schemas/order.schema';
import { AddressesService } from './addresses.service';
import { PaymentLogsService } from './payment-logs.service';
import { MarkOrderPaymentPaidRequest } from '../dto/orders/mark-order-payment-paid.orders.dto';

interface OrderOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class OrdersService {
  private readonly taxRate = 0.08;
  private readonly flatDeliveryCharge = 120;

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly addressesService: AddressesService,
    private readonly paymentLogsService: PaymentLogsService,
  ) {}

  async placeOrder(owner: OrderOwner, payload: PlaceOrderRequest) {
    this.assertOwner(owner);
    const root = await this.cartRepository.findRootByOwner(owner);
    if (!root?._id) {
      throw new BadRequestException('Cart is empty');
    }
    const lines = await this.cartRepository.findCheckoutLinesByParentCartId(String(root._id));
    if (!lines.length) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = lines.reduce(
      (sum, line) =>
        sum + lineSubtotal(Number(line.quantity ?? 0), Number(line.price ?? 0), line.discount),
      0,
    );
    const tax = Number((subtotal * this.taxRate).toFixed(2));
    const deliveryCharge = subtotal > 3000 ? 0 : this.flatDeliveryCharge;
    const total = subtotal + tax + deliveryCharge;

    const orderItems = lines.map((line) => {
      const ref = line.productId;
      let productId: Types.ObjectId;
      if (ref instanceof Types.ObjectId) {
        productId = ref;
      } else if (ref && typeof ref === 'object' && '_id' in (ref as object)) {
        const inner = (ref as { _id: unknown })._id;
        const hex = inner instanceof Types.ObjectId ? inner.toHexString() : String(inner);
        if (!Types.ObjectId.isValid(hex)) {
          throw new BadRequestException('Cart line has invalid product reference');
        }
        productId = new Types.ObjectId(hex);
      } else {
        const hex = String(ref ?? '');
        if (!Types.ObjectId.isValid(hex)) {
          throw new BadRequestException('Cart line has invalid product reference');
        }
        productId = new Types.ObjectId(hex);
      }
      return {
        product: productId,
        quantity: Number(line.quantity ?? 0),
        unitPrice: effectiveUnitPrice(Number(line.price ?? 0), line.discount),
      };
    });

    const userRef =
      owner.userId && Types.ObjectId.isValid(owner.userId.trim())
        ? new Types.ObjectId(owner.userId.trim())
        : undefined;

    const order = await this.ordersRepository.create({
      ...(userRef ? { user: userRef } : {}),
      sessionId: owner.sessionId,
      items: orderItems,
      paymentMethod: payload.paymentMethod,
      subtotal,
      tax,
      deliveryCharge,
      total,
      status: OrderStatus.CREATED,
    });

    const orderId = String(order._id);

    await this.addressesService.createOrderAddresses(orderId, {
      contactInfo: payload.contactInfo,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress,
    });

    await this.paymentLogsService.createOrderPaymentLog(orderId, total, payload.paymentMethod);

    await this.cartRepository.deleteAllLinesForParent(String(root._id));
    return order;
  }

  myOrders(owner: OrderOwner) {
    this.assertOwner(owner);
    return this.ordersRepository.findByOwner(owner);
  }

  listAll() {
    return this.ordersRepository.listAll();
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const updated = await this.ordersRepository.updateStatus(orderId, status);
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return updated;
  }

  async markOrderPaymentPaid(orderId: string, payload: MarkOrderPaymentPaidRequest) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const paymentLog = await this.paymentLogsService.markOrderPaymentPaid(orderId, payload.transactionId);
    if (!paymentLog) {
      throw new NotFoundException('Payment log not found for order');
    }

    if (order.status === OrderStatus.CREATED || order.status === OrderStatus.CONFIRMED) {
      await this.ordersRepository.updateStatus(orderId, OrderStatus.PROCESSING);
    }

    return {
      message: 'Payment marked as paid successfully',
      data: paymentLog,
    };
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
