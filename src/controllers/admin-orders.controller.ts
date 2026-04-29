import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { MarkOrderPaymentPaidRequest } from '../dto/orders/mark-order-payment-paid.orders.dto';
import { UpdateOrderStatusRequest } from '../dto/orders/update-order-status.orders.dto';
import { OrdersService } from '../services/orders.service';

@Controller('admin/orders')
@ApiTags('Admin - Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders (admin)' })
  listAll() {
    return this.ordersService.listAll();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusRequest) {
    return this.ordersService.updateOrderStatus(id, payload.status);
  }

  @Patch(':id/payment/paid')
  @ApiOperation({ summary: 'Mark order payment as paid (admin)' })
  markPaymentPaid(@Param('id') id: string, @Body() payload: MarkOrderPaymentPaidRequest) {
    return this.ordersService.markOrderPaymentPaid(id, payload);
  }
}
