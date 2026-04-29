import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WEARABLE_CATEGORIES } from '../common/types/category.enum';
import { CategoriesRepository } from '../repositories/categories.repository';

async function seedCategories() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const categoriesRepository = app.get(CategoriesRepository);
    await categoriesRepository.upsertDefaults(WEARABLE_CATEGORIES);
    // eslint-disable-next-line no-console
    console.log(`Seeded categories: ${WEARABLE_CATEGORIES.join(', ')}`);
  } finally {
    await app.close();
  }
}

void seedCategories();
