import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from '../services/cart.service';
import { UpdateCartRequest } from '../dto/cart/update-cart.cart.dto';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  addOrUpdate(@CurrentUser('sub') userId: string, @Body() payload: UpdateCartRequest) {
    return this.cartService.addOrUpdate(userId, payload);
  }

  @Delete('items/:productId')
  remove(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return this.cartService.remove(userId, productId);
  }
}
