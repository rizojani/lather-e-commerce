import { Body, Controller, Delete, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CartService } from '../services/cart.service';
import { UpdateCartRequest } from '../dto/cart/update-cart.cart.dto';

@Controller('cart')
@ApiTags('User - Cart')
@ApiBearerAuth()
@ApiHeader({ name: 'sessionId', required: false, description: 'Required when Authorization token is not provided' })
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  getCart(@CurrentUser('sub') userId: string | undefined, @Headers('sessionid') sessionId?: string) {
    return this.cartService.getCart({ userId, sessionId });
  }

  @Post('items')
  @ApiOperation({ summary: 'Add or update cart item' })
  addOrUpdate(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Body() payload: UpdateCartRequest,
  ) {
    return this.cartService.addOrUpdate({ userId, sessionId }, payload);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  remove(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Param('productId') productId: string,
  ) {
    return this.cartService.remove({ userId, sessionId }, productId);
  }
}
