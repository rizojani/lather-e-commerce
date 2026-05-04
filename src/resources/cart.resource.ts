import { lineSubtotal } from '../common/utils/cart-line-price';
import { ProductResource } from './product.resource';

export interface CartApiBundle {
  root: unknown;
  lines: unknown[];
  ownerKey: string;
}

function toPlain(input: unknown): Record<string, unknown> | null {
  if (input == null || typeof input !== 'object') return null;
  const obj = input as { toObject?: (opts?: { virtuals?: boolean }) => Record<string, unknown> };
  if (typeof obj.toObject === 'function') {
    return obj.toObject({ virtuals: true });
  }
  return input as Record<string, unknown>;
}

function idOfRef(ref: unknown): string {
  if (ref == null) return '';
  if (typeof ref === 'string') return ref.trim();
  if (typeof ref === 'object' && '_id' in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

export class CartResource {
  static one(bundle: CartApiBundle) {
    const rootPlain = toPlain(bundle.root);
    const rootId = rootPlain?._id != null ? String(rootPlain._id) : null;
    const items = bundle.lines.map((row) =>
      CartResource.cartLine(row as Record<string, unknown>, rootId ?? ''),
    );
    const subtotal = items.reduce((s, row) => s + row.lineTotal, 0);
    const itemCount = items.reduce((s, row) => s + row.quantity, 0);

    return {
      id: rootId,
      cartableType: 'user',
      cartableId: rootPlain?.cartableId != null ? String(rootPlain.cartableId) : bundle.ownerKey,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount,
      createdAt: rootPlain?.createdAt ?? null,
      updatedAt: rootPlain?.updatedAt ?? null,
    };
  }

  private static cartLine(plain: Record<string, unknown>, parentCartId: string) {
    const rawPid = plain.productId;
    const productId = idOfRef(rawPid);
    const qty = Math.max(0, Number(plain.quantity ?? 0));
    const price = Number(plain.price ?? 0);
    const discount =
      plain.discount != null && !Number.isNaN(Number(plain.discount))
        ? Number(plain.discount)
        : null;
    const total = lineSubtotal(qty, price, discount);

    let product: ReturnType<typeof ProductResource.collection>[number] | null = null;
    if (
      rawPid &&
      typeof rawPid === 'object' &&
      ('title' in rawPid || 'name' in rawPid || 'price' in rawPid)
    ) {
      const mapped = ProductResource.collection([rawPid as Record<string, unknown>]);
      product = mapped[0] ?? null;
    }

    return {
      id: plain._id != null ? String(plain._id) : '',
      cartableType: 'cart',
      cartableId: parentCartId || (plain.cartableId != null ? String(plain.cartableId) : ''),
      productId,
      quantity: qty,
      size: plain.size != null && String(plain.size).length > 0 ? String(plain.size) : null,
      color: plain.color != null && String(plain.color).length > 0 ? String(plain.color) : null,
      price,
      discount,
      lineTotal: total,
      product,
    };
  }
}
