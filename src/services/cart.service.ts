import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { normalizeProductMediaRefs } from '../common/utils/product-media-refs';
import { CartRepository, CartOwnerKey } from '../repositories/cart.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { AddOrUpdateCartItemDto } from '../dto/cart/update-cart.cart.dto';
import { MediaService } from './media.service';
import type { CartApiBundle } from '../resources/cart.resource';
import { CartDocument } from '../schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly mediaService: MediaService,
  ) {}

  async getCart(owner: CartOwnerKey): Promise<CartApiBundle> {
    this.assertOwner(owner);
    const ownerKey = this.ownerKey(owner);
    const root = await this.cartRepository.findRootByOwner(owner);
    if (!root) {
      return { root: null, lines: [], ownerKey };
    }
    const linesRaw = await this.cartRepository.findLinesByParentCartId(String(root._id));
    const lines = await this.hydrateLinesProductMedia(linesRaw);
    return { root, lines, ownerKey };
  }

  async addOrUpdate(owner: CartOwnerKey, payload: AddOrUpdateCartItemDto): Promise<CartApiBundle> {
    this.assertOwner(owner);
    const product = await this.productsRepository.findById(payload.productId);
    if (!product) throw new NotFoundException('Product not found');

    const root = await this.cartRepository.findOrCreateRootByOwner(owner);
    const parentId = String(root._id);
    const size = (payload.size ?? '').trim();
    const color = (payload.color ?? '').trim();

    const unitPrice =
      product.salePrice != null && product.salePrice > 0 ? product.salePrice : product.price;
    const discountPct =
      payload.discount !== undefined && payload.discount !== null
        ? payload.discount
        : product.hasDiscount && product.discountInPercentage != null
          ? product.discountInPercentage
          : undefined;

    const existing = await this.cartRepository.findLineByProductVariant(
      parentId,
      payload.productId,
      size,
      color,
    );

    if (existing) {
      existing.quantity = payload.quantity;
      existing.price = unitPrice;
      if (discountPct !== undefined) {
        existing.discount = discountPct;
      }
      await existing.save();
    } else {
      await this.cartRepository.createLine({
        parentCartId: parentId,
        productId: new Types.ObjectId(payload.productId),
        quantity: payload.quantity,
        size,
        color,
        price: unitPrice,
        discount: discountPct,
      });
    }

    const rootFresh = await this.cartRepository.findRootByOwner(owner);
    const linesRaw = await this.cartRepository.findLinesByParentCartId(parentId);
    const lines = await this.hydrateLinesProductMedia(linesRaw);
    return { root: rootFresh ?? root, lines, ownerKey: this.ownerKey(owner) };
  }

  async remove(owner: CartOwnerKey, productId: string): Promise<CartApiBundle> {
    this.assertOwner(owner);
    const root = await this.cartRepository.findRootByOwner(owner);
    const ownerKey = this.ownerKey(owner);
    if (!root) {
      return { root: null, lines: [], ownerKey };
    }
    await this.cartRepository.deleteLinesByProductId(String(root._id), productId);
    const linesRaw = await this.cartRepository.findLinesByParentCartId(String(root._id));
    const lines = await this.hydrateLinesProductMedia(linesRaw);
    return { root, lines, ownerKey };
  }

  private ownerKey(owner: CartOwnerKey): string {
    return String(owner.userId ?? owner.sessionId ?? '').trim();
  }

  private assertOwner(owner: CartOwnerKey) {
    if (!owner.userId && !owner.sessionId) {
      throw new BadRequestException('Authorization token or sessionId header is required');
    }
  }

  private toPlainProduct(p: unknown): Record<string, unknown> | null {
    if (p == null || typeof p !== 'object') return null;
    const obj = p as { toObject?: (opts?: { virtuals?: boolean }) => Record<string, unknown> };
    if (typeof obj.toObject === 'function') {
      return obj.toObject({ virtuals: true });
    }
    return p as Record<string, unknown>;
  }

  private async hydrateLinesProductMedia(lines: CartDocument[]): Promise<Record<string, unknown>[]> {
    return Promise.all(
      lines.map(async (line) => {
        const plain = line.toObject({ virtuals: true }) as Record<string, unknown>;
        const pid = plain.productId;
        const pPlain = this.toPlainProduct(pid);
        if (!pPlain) return plain;
        const mediaIds = normalizeProductMediaRefs(pPlain.media as unknown[]);
        const media = mediaIds.length ? await this.mediaService.findByIdsOrdered(mediaIds) : [];
        return { ...plain, productId: { ...pPlain, media } };
      }),
    );
  }
}
