import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from './cart.module';
import { Cart, CartSchema } from '../schemas/cart.schema';
import { AdminOrdersController } from '../controllers/admin-orders.controller';
import { UserOrdersController } from '../controllers/user-orders.controller';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrdersService } from '../services/orders.service';
import { Order, OrderSchema } from '../schemas/order.schema';
import { CartRepository } from '../repositories/cart.repository';

@Module({
  imports: [
    CartModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
  ],
  controllers: [UserOrdersController, AdminOrdersController],
  providers: [OrdersRepository, OrdersService, CartRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
