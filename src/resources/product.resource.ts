import { CategoryResource } from './category.resource';

function inferMediaKind(mimeType: string): 'image' | 'video' {
  const m = mimeType?.toLowerCase() ?? '';
  if (m.startsWith('video/')) return 'video';
  return 'image';
}

function mapCategoryField(cat: unknown) {
  if (cat && typeof cat === 'object' && 'name' in (cat as object)) {
    return CategoryResource.one(cat as Record<string, unknown>);
  }
  if (cat === undefined || cat === null) return null;
  return { id: String(cat) };
}

export class ProductResource {
  static mediaEntry(entry: unknown) {
    if (entry === null || entry === undefined) {
      return { id: '' };
    }
    if (typeof entry === 'string') {
      return { id: entry };
    }
    if (
      typeof entry === 'object' &&
      entry !== null &&
      'toHexString' in entry &&
      typeof (entry as { toHexString: () => string }).toHexString === 'function'
    ) {
      return { id: String(entry) };
    }
    const m = entry as Record<string, unknown>;
    if (!('mimeType' in m) && !('originalName' in m)) {
      return { id: m.id ?? String(m._id ?? '') };
    }
    return {
      id: m.id ?? String(m._id ?? ''),
      originalName: m.originalName ?? '',
      mimeType: m.mimeType ?? '',
      path: m.path ?? '',
      kind: inferMediaKind(String(m.mimeType ?? '')),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  /** Admin create / detail: nested category + medias (Laravel-style relations). */
  static adminDetail(item: Record<string, unknown>) {
    const category = item.category;
    const rawMedia = item.media;
    const medias = Array.isArray(rawMedia) ? rawMedia.map((x) => ProductResource.mediaEntry(x)) : [];

    const categoryObj = category && typeof category === 'object' && 'name' in (category as object)
      ? CategoryResource.one(category as Record<string, unknown>)
      : null;

    return {
      id: item.id ?? String(item._id ?? ''),
      categoryId: categoryObj
        ? categoryObj.id
        : String(category ?? ''),
      title: item.title ?? item.name ?? '',
      description: item.description,
      inventoryStatus: item.inventoryStatus ?? null,
      status: item.status ?? null,
      price: item.price,
      hasDiscount: item.hasDiscount ?? false,
      discountInPercentage: item.discountInPercentage ?? null,
      category: categoryObj,
      medias,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static collection(products: Array<Record<string, unknown>>) {
    return products.map((item) => ({
      id: item.id ?? String(item._id ?? ''),
      title: item.title ?? item.name,
      name: item.name ?? item.title,
      description: item.description,
      category: mapCategoryField(item.category),
      inventoryStatus: item.inventoryStatus ?? null,
      status: item.status ?? null,
      gender: item.gender,
      sizes: item.sizes,
      colors: item.colors,
      price: item.price,
      hasDiscount: item.hasDiscount ?? false,
      discountInPercentage: item.discountInPercentage ?? null,
      salePrice: item.salePrice,
      averageRating: item.averageRating,
      reviewCount: item.reviewCount,
      stock: item.stock,
      medias: Array.isArray(item.media) ? item.media.map((x) => ProductResource.mediaEntry(x)) : [],
      createdAt: item.createdAt,
    }));
  }

  /** Admin paginated list: same as `collection` but no `medias` (media relation not loaded). */
  static collectionAdminList(products: Array<Record<string, unknown>>) {
    return products.map((item) => ({
      id: item.id ?? String(item._id ?? ''),
      title: item.title ?? item.name,
      name: item.name ?? item.title,
      description: item.description,
      category: mapCategoryField(item.category),
      inventoryStatus: item.inventoryStatus ?? null,
      status: item.status ?? null,
      gender: item.gender,
      sizes: item.sizes,
      colors: item.colors,
      price: item.price,
      hasDiscount: item.hasDiscount ?? false,
      discountInPercentage: item.discountInPercentage ?? null,
      salePrice: item.salePrice,
      averageRating: item.averageRating,
      reviewCount: item.reviewCount,
      stock: item.stock,
      createdAt: item.createdAt,
    }));
  }
}
