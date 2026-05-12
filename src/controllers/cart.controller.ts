import { Body, Controller, Delete, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CartResource } from '../resources/cart.resource';
import { CartService } from '../services/cart.service';
import { AddOrUpdateCartItemDto } from '../dto/cart/update-cart.cart.dto';

@Controller('cart')
@ApiTags('User - Cart')
@ApiBearerAuth()
@ApiHeader({ name: 'sessionId', required: false, description: 'Required when Authorization token is not provided' })
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user cart',
    description:
      'Returns the user cart header (`cartableType: user`) and line items (`cartableType: cart`) with nested `product` including medias.',
  })
  @ResponseMessage('Cart fetched successfully')
  async getCart(@CurrentUser('sub') userId: string | undefined, @Headers('sessionid') sessionId?: string) {
    const cart = await this.cartService.getCart({ userId, sessionId });
    return CartResource.one(cart);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add or update cart line',
    description:
      'Finds or creates the user cart (`cartableType: user`), then upserts a line (`cartableType: cart`) keyed by product + size + color. Snapshots `price` and optional `discount` %.',
  })
  @ResponseMessage('Cart item saved successfully')
  async addOrUpdate(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Body() payload: AddOrUpdateCartItemDto,
  ) {
    const cart = await this.cartService.addOrUpdate({ userId, sessionId }, payload);
    return CartResource.one(cart);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ResponseMessage('Cart item removed successfully')
  async remove(
    @CurrentUser('sub') userId: string | undefined,
    @Headers('sessionid') sessionId: string | undefined,
    @Param('productId') productId: string,
  ) {
    const cart = await this.cartService.remove({ userId, sessionId }, productId);
    return CartResource.one(cart);
  }
}
