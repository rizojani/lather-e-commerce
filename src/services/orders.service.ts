import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { effectiveUnitPrice, lineSubtotal } from '../common/utils/cart-line-price';
import { CartRepository } from '../repositories/cart.repository';
import { OrderItemsRepository } from '../repositories/order-items.repository';
import { OrdersRepository } from '../repositories/orders.repository';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { ListMyOrdersQueryDto } from '../dto/orders/list-my-orders.orders.dto';
import { OrderStatus } from '../schemas/order.schema';
import type { OrderDocument } from '../schemas/order.schema';
import { ListAdminOrdersQueryDto } from '../dto/orders/list-admin-orders.orders.dto';
import { PatchAdminOrderDto } from '../dto/orders/patch-admin-order.orders.dto';
import { PaymentLogResource } from '../resources/payment-log.resource';
import { UsersRepository } from '../repositories/users.repository';
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
    private readonly orderItemsRepository: OrderItemsRepository,
    private readonly addressesService: AddressesService,
    private readonly paymentLogsService: PaymentLogsService,
    private readonly usersRepository: UsersRepository,
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

    const lineInputs = lines.map((line) => {
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
      const listPrice = Number(line.price ?? 0);
      const disc =
        line.discount != null && !Number.isNaN(Number(line.discount)) ? Number(line.discount) : undefined;
      return {
        productId,
        quantity: Number(line.quantity ?? 0),
        unitPrice: effectiveUnitPrice(listPrice, line.discount),
        size: String(line.size ?? '').trim(),
        color: String(line.color ?? '').trim(),
        price: listPrice,
        discount: disc,
      };
    });

    const userRef =
      owner.userId && Types.ObjectId.isValid(owner.userId.trim())
        ? new Types.ObjectId(owner.userId.trim())
        : undefined;

    const order = await this.ordersRepository.create({
      ...(userRef ? { user: userRef } : {}),
      sessionId: owner.sessionId,
      paymentMethod: payload.paymentMethod,
      subtotal,
      tax,
      deliveryCharge,
      total,
      status: OrderStatus.CREATED,
    });

    const orderId = String(order._id);

    const insertedItems = await this.orderItemsRepository.createManyForOrder(orderId, lineInputs);

    await this.addressesService.createOrderAddresses(orderId, {
      contactInfo: payload.contactInfo,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress,
    });

    await this.paymentLogsService.createOrderPaymentLog(orderId, total, payload.paymentMethod);

    await this.cartRepository.deleteAllLinesForParent(String(root._id));

    const orderWithRelations = await this.ordersRepository.findByIdWithAddresses(orderId);
    const orderPlain = (orderWithRelations ?? order).toObject({ virtuals: true }) as unknown as Record<string, unknown>;

    return {
      ...orderPlain,
      items: insertedItems.map((i) => i.toObject({ virtuals: true })),
    };
  }

  async myOrders(owner: OrderOwner, query?: ListMyOrdersQueryDto) {
    this.assertOwner(owner);
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(query?.limit && query.limit > 0 ? query.limit : 10, 100);
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (query?.fromDate) {
      const d = new Date(query.fromDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(0, 0, 0, 0);
        fromDate = d;
      }
    }
    if (query?.toDate) {
      const d = new Date(query.toDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        toDate = d;
      }
    }
    if (fromDate && toDate && fromDate > toDate) {
      const t = fromDate;
      fromDate = toDate;
      toDate = t;
    }
    const { data, total } = await this.ordersRepository.findOwnerOrdersPaginated({
      owner,
      page,
      limit,
      search: query?.search,
      status: query?.status,
      paymentStatus: query?.paymentStatus,
      fromDate,
      toDate,
    });
    return { data, total, page, limit };
  }

  /** Order must belong to JWT user or guest session (same rules as cart). */
  async getOrderByIdForOwner(owner: OrderOwner, orderId: string) {
    this.assertOwner(owner);
    if (!Types.ObjectId.isValid(orderId.trim())) {
      throw new BadRequestException('Invalid order id');
    }
    const order = await this.ordersRepository.findByIdWithAddresses(orderId.trim());
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!this.orderBelongsToOwner(order, owner)) {
      throw new NotFoundException('Order not found');
    }
    const items = await this.orderItemsRepository.aggregateLinesForOrderDetail(orderId.trim());
    return { order, items };
  }

  async listAll() {
    const rows = await this.ordersRepository.listAllWithLineItems();
    return rows as Array<Record<string, unknown>>;
  }

  async adminListOrders(query: ListAdminOrdersQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(query.limit && query.limit > 0 ? query.limit : 10, 100);
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (query.fromDate) {
      const d = new Date(query.fromDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(0, 0, 0, 0);
        fromDate = d;
      }
    }
    if (query.toDate) {
      const d = new Date(query.toDate);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        toDate = d;
      }
    }
    if (fromDate && toDate && fromDate > toDate) {
      const t = fromDate;
      fromDate = toDate;
      toDate = t;
    }
    const { data, total } = await this.ordersRepository.adminOrdersPaginated({
      page,
      limit,
      search: query.search,
      status: query.status,
      fromDate,
      toDate,
      paymentStatus: query.paymentStatus,
      userId: query.userId,
    });
    return { data, total, page, limit };
  }

  /** Admin: full order row for `OrderResource.adminOne` (parallel loads, no N+1). */
  async getOrderAdminById(orderId: string): Promise<Record<string, unknown>> {
    const id = orderId.trim();
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order id');
    }
    const order = await this.ordersRepository.findByIdWithAddresses(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const plain = order.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    const [items, paymentLog, user] = await Promise.all([
      this.orderItemsRepository.aggregateLinesForOrderDetail(id),
      this.paymentLogsService.findOneByOrderId(id),
      order.user
        ? this.usersRepository.findByIdForAdmin(String(order.user))
        : Promise.resolve(null),
    ]);
    return {
      ...plain,
      items,
      user: user ?? null,
      paymentLog: paymentLog ?? null,
    };
  }

  async patchOrderAdmin(orderId: string, dto: PatchAdminOrderDto): Promise<Record<string, unknown>> {
    const id = orderId.trim();
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order id');
    }
    const existing = await this.ordersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Order not found');
    }
    const needsReason =
      dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.REJECTED;
    const reasonTrim = (dto.reason ?? '').trim();
    if (needsReason && !reasonTrim) {
      throw new BadRequestException('reason is required when status is cancelled or rejected');
    }
    const statusReason = needsReason ? reasonTrim : null;
    const updated = await this.ordersRepository.updateOrderAdmin(id, dto.status, statusReason);
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return this.getOrderAdminById(id);
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

    const logPlain = paymentLog.toObject
      ? paymentLog.toObject({ virtuals: true })
      : (paymentLog as unknown as Record<string, unknown>);
    return {
      message: 'Payment marked as paid successfully',
      data: PaymentLogResource.one(logPlain),
    };
  }

  trendingCurrentYear() {
    return this.orderItemsRepository.aggregateTrendingProductsCurrentYear();
  }

  private orderBelongsToOwner(order: OrderDocument, owner: OrderOwner): boolean {
    if (owner.userId?.trim()) {
      return order.user != null && String(order.user) === owner.userId.trim();
    }
    if (owner.sessionId?.trim()) {
      return order.sessionId != null && order.sessionId === owner.sessionId.trim();
    }
    return false;
  }

  private assertOwner(owner: OrderOwner) {
    if (!owner.userId && !owner.sessionId) {
      throw new BadRequestException('Authorization token or sessionId header is required');
    }
  }
}
