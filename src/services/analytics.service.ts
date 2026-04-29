import { Injectable } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { ProductsService } from '../services/products.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  async dashboard() {
    const [orders, trending, popularProducts] = await Promise.all([
      this.ordersService.listAll(),
      this.ordersService.trendingCurrentYear(),
      this.productsService.popular(),
    ]);

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      totalOrders: orders.length,
      totalSales,
      trendingProducts: trending,
      popularProducts,
    };
  }
}
