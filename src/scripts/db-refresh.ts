import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { CategoriesService } from '../services/categories.service';
import { Media } from '../schemas/media.schema';

function normalizeMediaPath(pathValue: string): string {
  return pathValue.replace(/\\/g, '/');
}

/**
 * Full dev refresh: **migrations first**, then wipe categories, migrate again (index sync),
 * seed wearable roots, then media path normalization.
 *
 * Does **not** drop products, users, orders, carts, etc. (only `categories` is cleared.)
 */
async function dbRefresh() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const categoriesService = app.get(CategoriesService);

    // eslint-disable-next-line no-console
    console.log('db:refresh — (1/5) category migration…');
    await categoriesService.migrateCategories();

    // eslint-disable-next-line no-console
    console.log('db:refresh — (2/5) clearing categories…');
    const { deletedCount } = await categoriesService.clearAllCategories();
    // eslint-disable-next-line no-console
    console.log(`db:refresh — removed ${deletedCount} category document(s).`);

    // eslint-disable-next-line no-console
    console.log('db:refresh — (3/5) category migration (post-clear index sync)…');
    await categoriesService.migrateCategories();

    // eslint-disable-next-line no-console
    console.log('db:refresh — (4/5) seeding wearable category roots…');
    await categoriesService.seedWearableRoots();

    // eslint-disable-next-line no-console
    console.log('db:refresh — (5/5) media path normalization…');
    const mediaModel = app.get<Model<Media>>(getModelToken(Media.name));
    const docs = await mediaModel.find({ path: { $regex: /\\/ } }).select({ _id: 1, path: 1 }).lean().exec();
    if (docs.length === 0) {
      // eslint-disable-next-line no-console
      console.log('db:refresh — no media paths needed normalization.');
    } else {
      const ops = docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { path: normalizeMediaPath(String(doc.path ?? '')) } },
        },
      }));
      const result = await mediaModel.bulkWrite(ops, { ordered: false });
      // eslint-disable-next-line no-console
      console.log(`db:refresh — normalized media paths: ${result.modifiedCount ?? 0}/${docs.length}`);
    }

    // eslint-disable-next-line no-console
    console.log('db:refresh — done.');
  } finally {
    await app.close();
  }
}

void dbRefresh();
