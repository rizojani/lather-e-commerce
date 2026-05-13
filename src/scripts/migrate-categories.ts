import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../services/categories.service';

/** Drops legacy `name` unique index, backfills morph/slug/title fields, syncs indexes. */
async function migrateCategories() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const categoriesService = app.get(CategoriesService);
    await categoriesService.migrateCategories();
    // eslint-disable-next-line no-console
    console.log('Category migration finished.');
  } finally {
    await app.close();
  }
}

void migrateCategories();
