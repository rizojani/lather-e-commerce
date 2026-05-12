import { lineSubtotal } from '../common/utils/cart-line-price';
import { PaymentLogResource } from './payment-log.resource';
import { ProductResource } from './product.resource';
import { UserResource } from './user.resource';

/** Matches cart/storefront: string ids from ObjectIds, populated refs, or `{ _id }`. */
function idOfRef(ref: unknown): string {
  if (ref == null) return '';
  if (typeof ref === 'string') return ref.trim();
  if (typeof ref === 'object' && '_id' in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

function toPlain(input: unknown): Record<string, unknown> {
  if (input == null || typeof input !== 'object') {
    return {};
  }
  const obj = input as { toObject?: (opts?: { virtuals?: boolean }) => Record<string, unknown> };
  if (typeof obj.toObject === 'function') {
    return obj.toObject({ virtuals: true });
  }
  return input as Record<string, unknown>;
}

function plainOrNull(input: unknown): Record<string, unknown> | null {
  if (input == null || typeof input !== 'object') return null;
  const obj = input as { toObject?: (opts?: { virtuals?: boolean }) => Record<string, unknown> };
  if (typeof obj.toObject === 'function') return obj.toObject({ virtuals: true });
  return input as Record<string, unknown>;
}

function mapAddressFull(input: unknown) {
  const addr = plainOrNull(input);
  if (!addr) return null;
  return {
    id: addr._id != null ? String(addr._id) : addr.id != null ? String(addr.id) : '',
    fullName: addr.fullName ?? '',
    phone: addr.phone ?? '',
    email: addr.email ?? null,
    addressLine1: addr.addressLine1 ?? null,
    addressLine2: addr.addressLine2 ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    country: addr.country ?? null,
    postalCode: addr.postalCode ?? null,
  };
}

function mapContactInfo(input: unknown) {
  const addr = plainOrNull(input);
  if (!addr) return null;
  return {
    id: addr._id != null ? String(addr._id) : addr.id != null ? String(addr.id) : '',
    fullName: addr.fullName ?? '',
    phone: addr.phone ?? '',
    email: addr.email ?? null,
  };
}

export interface OrderAddressBundle {
  contactInfo?: unknown;
  shippingAddress?: unknown;
  billingAddress?: unknown;
}

export class OrderResource {
  /** Single order header + line items (consistent API shape). */
  static one(orderHeader: unknown, itemsRaw: unknown[], addresses?: OrderAddressBundle | null) {
    const order = toPlain(orderHeader);
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((row) => OrderResource.itemLine(toPlain(row)))
      : [];

    return {
      id: String(order._id ?? order.id ?? ''),
      userId: order.user != null ? String(order.user) : null,
      sessionId: order.sessionId != null ? String(order.sessionId) : null,
      paymentMethod: order.paymentMethod ?? null,
      subtotal: Number(order.subtotal ?? 0),
      tax: Number(order.tax ?? 0),
      deliveryCharge: Number(order.deliveryCharge ?? 0),
      total: Number(order.total ?? 0),
      status: order.status ?? null,
      statusReason: order.statusReason ?? null,
      contactInfo: mapContactInfo(addresses?.contactInfo),
      shippingAddress: mapAddressFull(addresses?.shippingAddress),
      billingAddress: mapAddressFull(addresses?.billingAddress),
      items,
      createdAt: order.createdAt ?? null,
      updatedAt: order.updatedAt ?? null,
    };
  }

  /** From `{ ...order, items: [...] }` rows (e.g. list endpoints). */
  static fromMerged(orderWithItems: Record<string, unknown>) {
    const { items, contactInfo, shippingAddress, billingAddress, ...rest } = orderWithItems;
    return OrderResource.one(rest, Array.isArray(items) ? items : [], {
      contactInfo,
      shippingAddress,
      billingAddress,
    });
  }

  static collection(orders: Array<Record<string, unknown>>) {
    return orders.map((row) => OrderResource.fromMerged(row));
  }

  /** Admin: merged aggregation/service row with `user`, `paymentLog`, `items`. */
  static adminOne(row: Record<string, unknown>) {
    const { items, user, paymentLog, contactInfo, shippingAddress, billingAddress, ...rest } = row;
    const base = OrderResource.one(
      rest,
      Array.isArray(items) ? (items as unknown[]) : [],
      { contactInfo, shippingAddress, billingAddress },
    );
    return {
      ...base,
      user: UserResource.forOrder(user),
      paymentLog: PaymentLogResource.one(paymentLog),
    };
  }

  static adminCollection(rows: Array<Record<string, unknown>>) {
    return rows.map((row) => OrderResource.adminOne(row));
  }

  /**
   * Order line from DB / aggregation. When `product` is present (GET /orders/:id),
   * it is mapped like storefront products: `category` + `medias` from nested `media`.
   */
  private static itemLine(line: Record<string, unknown>) {
    const qty = Number(line.quantity ?? 0);
    const unit = Number(line.unitPrice ?? 0);
    const hasPrice = line.price != null && !Number.isNaN(Number(line.price));
    const listPrice = hasPrice ? Number(line.price) : unit;
    const discount =
      line.discount != null && !Number.isNaN(Number(line.discount)) ? Number(line.discount) : null;
    const lineTotal = hasPrice || discount != null
      ? lineSubtotal(qty, listPrice, discount)
      : Math.round(qty * unit * 100) / 100;

    let productIdStr = idOfRef(line.productId);
    let product: ReturnType<typeof ProductResource.collection>[number] | null = null;

    if (line.product && typeof line.product === 'object') {
      const mapped = ProductResource.collection([line.product as Record<string, unknown>]);
      product = mapped[0] ?? null;
      if (!productIdStr && product?.id != null) {
        productIdStr = String(product.id);
      }
    } else {
      const pref = line.productId;
      if (pref && typeof pref === 'object' && ('title' in pref || 'name' in pref || 'price' in pref)) {
        const mapped = ProductResource.collection([pref as Record<string, unknown>]);
        product = mapped[0] ?? null;
        productIdStr =
          (product?.id != null ? String(product.id) : '') ||
          idOfRef((pref as { _id?: unknown })._id);
      }
    }

    const sizeRaw = line.size != null ? String(line.size).trim() : '';
    const colorRaw = line.color != null ? String(line.color).trim() : '';

    return {
      id: idOfRef(line._id) || String(line.id ?? ''),
      orderId: idOfRef(line.orderId),
      productId: productIdStr,
      quantity: qty,
      size: sizeRaw.length > 0 ? sizeRaw : null,
      color: colorRaw.length > 0 ? colorRaw : null,
      price: listPrice,
      discount,
      unitPrice: unit,
      lineTotal,
      product,
      createdAt: line.createdAt ?? null,
      updatedAt: line.updatedAt ?? null,
    };
  }
}
