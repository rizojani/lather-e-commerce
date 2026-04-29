import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from '../schemas/media.schema';
import { MediaService } from '../services/media.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }])],
  providers: [MediaService],
  exports: [MediaService, MongooseModule],
})
export class MediaModule {}
