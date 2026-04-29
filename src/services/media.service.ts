import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Media, MediaDocument, MediaOwnerType, MediaType } from '../schemas/media.schema';

interface CreateMediaPayload {
  file: Express.Multer.File;
  modelType: MediaOwnerType;
  modelId: string;
  type: MediaType;
}

@Injectable()
export class MediaService {
  constructor(@InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>) {}

  create(payload: CreateMediaPayload) {
    return this.mediaModel.create({
      originalName: payload.file.originalname,
      mimeType: payload.file.mimetype,
      path: payload.file.path,
      type: payload.type,
      modelType: payload.modelType,
      modelId: new Types.ObjectId(payload.modelId),
    });
  }
}
