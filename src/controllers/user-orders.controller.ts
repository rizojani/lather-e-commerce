import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListMyOrdersQueryDto } from '../dto/orders/list-my-orders.orders.dto';
import { OrderStatus } from '../schemas/order.schema';
import { PaymentStatus } from '../schemas/payment-log.schema';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
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
  @ResponseMessage('Order placed successfully')
  async placeOrder(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Body() payload: PlaceOrderRequest,
  ) {
    const data = await this.ordersService.placeOrder({ userId, sessionId }, payload);
    return OrderResource.fromMerged(data as Record<string, unknown>);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders (paginated, optional filters)',
    description:
      'Logged-in users: filtered by their `userId`. Guest users: filtered by `sessionId` header. Returns 401-style empty owner error if neither is present.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Match product title/name or category name' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'fromDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'toDate', required: false, example: '2025-12-31' })
  @ResponseMessage('Orders fetched successfully')
  async listOrders(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId?: string,
    @Query() query?: ListMyOrdersQueryDto,
  ) {
    const owner = userId?.trim() ? { userId } : { sessionId };
    const { data, total, page, limit } = await this.ordersService.myOrders(owner, query);
    return {
      items: OrderResource.collection(data as Array<Record<string, unknown>>),
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', description: 'Order MongoDB id' })
  @ResponseMessage('Order fetched successfully')
  async getOne(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Param('id') id: string,
  ) {
    const { order, items } = await this.ordersService.getOrderByIdForOwner({ userId, sessionId }, id);
    const orderPlain = order.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    return OrderResource.fromMerged({ ...orderPlain, items });
  }
}
