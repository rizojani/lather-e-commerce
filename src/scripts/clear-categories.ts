import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../services/categories.service';

/** Wipes the `categories` collection (does not touch products). */
async function clearCategories() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const categoriesService = app.get(CategoriesService);
    const { deletedCount } = await categoriesService.clearAllCategories();
    // eslint-disable-next-line no-console
    console.log(`clear:categories — removed ${deletedCount} document(s). Product category refs may be stale until re-seeded.`);
  } finally {
    await app.close();
  }
}

void clearCategories();
