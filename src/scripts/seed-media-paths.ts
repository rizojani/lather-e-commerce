import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Media } from '../schemas/media.schema';

function normalizeMediaPath(pathValue: string): string {
  return pathValue.replace(/\\/g, '/');
}

async function seedMediaPaths() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const mediaModel = app.get<Model<Media>>(getModelToken(Media.name));
    const docs = await mediaModel.find({ path: { $regex: /\\/ } }).select({ _id: 1, path: 1 }).lean().exec();

    if (docs.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No media paths require normalization.');
      return;
    }

    const ops = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { path: normalizeMediaPath(String(doc.path ?? '')) } },
      },
    }));

    const result = await mediaModel.bulkWrite(ops, { ordered: false });
    const updated = result.modifiedCount ?? 0;

    // eslint-disable-next-line no-console
    console.log(`Normalized media paths: ${updated}/${docs.length}`);
  } finally {
    await app.close();
  }
}

void seedMediaPaths();
