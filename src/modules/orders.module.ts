import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesModule } from './addresses.module';
import { CartModule } from './cart.module';
import { AdminOrdersController } from '../controllers/admin-orders.controller';
import { UserOrdersController } from '../controllers/user-orders.controller';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrdersService } from '../services/orders.service';
import { Order, OrderSchema } from '../schemas/order.schema';
import { PaymentLogsModule } from './payment-logs.module';

@Module({
  imports: [
    CartModule,
    AddressesModule,
    PaymentLogsModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [UserOrdersController, AdminOrdersController],
  providers: [OrdersRepository, OrdersService],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
