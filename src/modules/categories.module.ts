import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminCategoriesController } from '../controllers/admin-categories.controller';
import { UserCategoriesController } from '../controllers/user-categories.controller';
import { CategoriesRepository } from '../repositories/categories.repository';
import { CategoriesService } from '../services/categories.service';
import { Category, CategorySchema } from '../schemas/category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [AdminCategoriesController, UserCategoriesController],
  providers: [CategoriesRepository, CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
