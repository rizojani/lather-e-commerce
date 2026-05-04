export class CategoryResource {
  static one(item: Record<string, unknown>) {
    return {
      id: item.id ?? String(item._id ?? ''),
      name: item.name,
      title: item.name,
      description: item.description ?? null,
      status: item.status ?? 'active',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /** Public dropdown: active only, sorted A→Z by title (stored as `name`). */
  static dropdown(items: Array<Record<string, unknown>>) {
    return items.map((item) => ({
      id: item.id ?? String(item._id ?? ''),
      title: String(item.name ?? ''),
    }));
  }

  static collection(items: Array<Record<string, unknown>>) {
    return items.map((item) => CategoryResource.one(item));
  }
}
