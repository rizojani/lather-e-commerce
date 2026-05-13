import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../services/categories.service';

/** Truncates `categories` and inserts men / women / kid + six subcategories each (demo tree). */
async function seedCategoryTree() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const categoriesService = app.get(CategoriesService);
    await categoriesService.truncateAndSeedCategories();
    // eslint-disable-next-line no-console
    console.log('seed:categories:tree — truncate + gender tree finished.');
  } finally {
    await app.close();
  }
}

void seedCategoryTree();
