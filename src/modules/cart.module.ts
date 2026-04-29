import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from '../controllers/cart.controller';
import { CartRepository } from '../repositories/cart.repository';
import { CartService } from '../services/cart.service';
import { Cart, CartSchema } from '../schemas/cart.schema';
import { ProductsModule } from './products.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]), ProductsModule],
  controllers: [CartController],
  providers: [CartRepository, CartService],
  exports: [CartService],
})
export class CartModule {}
