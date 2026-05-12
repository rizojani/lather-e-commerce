import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { ListAdminOrdersQueryDto } from '../dto/orders/list-admin-orders.orders.dto';
import { MarkOrderPaymentPaidRequest } from '../dto/orders/mark-order-payment-paid.orders.dto';
import { PatchAdminOrderDto } from '../dto/orders/patch-admin-order.orders.dto';
import { OrderResource } from '../resources/order.resource';
import { OrdersService } from '../services/orders.service';
import { OrderStatus } from '../schemas/order.schema';
import { PaymentStatus } from '../schemas/payment-log.schema';

@Controller('admin/orders')
@ApiTags('Admin - Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List orders (paginated, optional filters)',
    description:
      'Each row includes line items, customer `user`, and `paymentLog`. Search matches user name/email, product title, or category name. Omit query params to skip that filter.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'fromDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'toDate', required: false, example: '2025-12-31' })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'userId', required: false, description: 'Mongo id of ordering user' })
  @ResponseMessage('Orders fetched successfully')
  async list(@Query() query: ListAdminOrdersQueryDto) {
    const { data, total, page, limit } = await this.ordersService.adminListOrders(query);
    return {
      items: OrderResource.adminCollection(data),
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id (admin)' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Order fetched successfully')
  async getOne(@Param('id') id: string) {
    const row = await this.ordersService.getOrderAdminById(id);
    return OrderResource.adminOne(row);
  }

  @Patch(':id/payment/paid')
  @ApiOperation({ summary: 'Mark order payment as paid (admin)' })
  @ResponseMessage('Payment marked as paid successfully')
  markPaymentPaid(@Param('id') id: string, @Body() payload: MarkOrderPaymentPaidRequest) {
    return this.ordersService.markOrderPaymentPaid(id, payload);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update order status (admin)',
    description: 'Provide `reason` when setting status to `cancelled` or `rejected`.',
  })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Order updated successfully')
  async patch(@Param('id') id: string, @Body() payload: PatchAdminOrderDto) {
    const row = await this.ordersService.patchOrderAdmin(id, payload);
    return OrderResource.adminOne(row);
  }
}
