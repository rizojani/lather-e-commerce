export class ProductResource {
  static collection(products: Array<Record<string, unknown>>) {
    return products.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      gender: item.gender,
      sizes: item.sizes,
      colors: item.colors,
      price: item.price,
      salePrice: item.salePrice,
      averageRating: item.averageRating,
      reviewCount: item.reviewCount,
      stock: item.stock,
      createdAt: item.createdAt,
    }));
  }
}
