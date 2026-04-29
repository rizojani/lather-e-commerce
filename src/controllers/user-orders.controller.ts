import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { OrdersService } from '../services/orders.service';

@Controller('orders')
@ApiTags('User - Orders')
@ApiBearerAuth()
@ApiHeader({ name: 'sessionId', required: false, description: 'Required when Authorization token is not provided' })
@UseGuards(OptionalJwtAuthGuard)
export class UserOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place order' })
  placeOrder(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Body() payload: PlaceOrderRequest,
  ) {
    return this.ordersService.placeOrder({ userId, sessionId }, payload);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(@CurrentUser('sub') userId: string | undefined, @Headers('sessionid') sessionId?: string) {
    return this.ordersService.myOrders({ userId, sessionId });
  }
}
