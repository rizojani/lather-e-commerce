import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminProductsController } from '../controllers/admin-products.controller';
import { UserProductsController } from '../controllers/user-products.controller';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductsService } from '../services/products.service';
import { Product, ProductSchema } from '../schemas/product.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [AdminProductsController, UserProductsController],
  providers: [ProductsRepository, ProductsService],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
