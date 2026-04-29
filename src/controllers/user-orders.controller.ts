import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { OrdersService } from '../services/orders.service';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class UserOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  placeOrder(@CurrentUser('sub') userId: string, @Body() payload: PlaceOrderRequest) {
    return this.ordersService.placeOrder(userId, payload);
  }

  @Get('my')
  myOrders(@CurrentUser('sub') userId: string) {
    return this.ordersService.myOrders(userId);
  }
}
