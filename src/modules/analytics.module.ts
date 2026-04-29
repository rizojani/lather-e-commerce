import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from '../controllers/admin-analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { OrdersModule } from './orders.module';
import { ProductsModule } from './products.module';

@Module({
  imports: [OrdersModule, ProductsModule],
  controllers: [AdminAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
