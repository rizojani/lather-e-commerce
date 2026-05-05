import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PlaceOrderRequest } from '../dto/orders/place-order.orders.dto';
import { OrderResource } from '../resources/order.resource';
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
  async placeOrder(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Body() payload: PlaceOrderRequest,
  ) {
    const data = await this.ordersService.placeOrder({ userId, sessionId }, payload);
    const { items, ...orderHeader } = data as Record<string, unknown> & {
      items: unknown[];
    };
    return OrderResource.one(orderHeader, items ?? []);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  async myOrders(@CurrentUser('sub') userId: string | undefined, @Headers('sessionid') sessionId?: string) {
    const rows = await this.ordersService.myOrders({ userId, sessionId });
    return OrderResource.collection(rows as Array<Record<string, unknown>>);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', description: 'Order MongoDB id' })
  async getOne(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Param('id') id: string,
  ) {
    const { order, items } = await this.ordersService.getOrderByIdForOwner({ userId, sessionId }, id);
    return OrderResource.one(order, items);
  }
}
