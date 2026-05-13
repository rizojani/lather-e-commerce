export class CategoryResource {
  static one(item: Record<string, unknown>): Record<string, unknown> {
    const nested = item.subCategories ?? item.children;
    const base = {
      id: item.id ?? String(item._id ?? ''),
      categoryableType: item.categoryableType ?? null,
      categoryableId: item.categoryableId ? String(item.categoryableId) : null,
      name: item.name,
      slug: item.slug,
      title: (item.title as string | undefined) ?? (item.name as string | undefined) ?? '',
      description: item.description ?? '',
      image: item.image ?? null,
      featured: Boolean(item.featured),
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : Number(item.sortOrder ?? 0),
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
      status: item.status ?? 'active',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt ?? null,
    };

    if (Array.isArray(nested)) {
      return {
        ...base,
        subCategories: CategoryResource.collection(nested as Array<Record<string, unknown>>),
      };
    }

    return base;
  }

  static dropdown(items: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return items.map((item) => ({
      id: item.id ?? String(item._id ?? ''),
      title: String((item.title as string | undefined) ?? item.name ?? ''),
      slug: item.slug != null ? String(item.slug) : undefined,
    }));
  }

  static collection(items: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return items.map((item) => CategoryResource.one(item));
  }

  static tree(roots: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return CategoryResource.collection(roots);
  }
}
