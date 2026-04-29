import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { CategoriesModule } from './modules/categories.module';
import { ProductsModule } from './modules/products.module';
import { CartModule } from './modules/cart.module';
import { OrdersModule } from './modules/orders.module';
import { AddressesModule } from './modules/addresses.module';
import { PaymentLogsModule } from './modules/payment-logs.module';
import { ReviewsModule } from './modules/reviews.module';
import { WishlistModule } from './modules/wishlist.module';
import { NotificationsModule } from './modules/notifications.module';
import { AnalyticsModule } from './modules/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://127.0.0.1:27017/lather-emarket'),
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    AddressesModule,
    PaymentLogsModule,
    ReviewsModule,
    WishlistModule,
    NotificationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
