import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
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

  findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return Promise.resolve(null);
    }
    return this.mediaModel.findById(id).exec();
  }

  /** Full media rows in the same order as `ids` (for responses when populate is unreliable). */
  async findByIdsOrdered(ids: string[]): Promise<Array<Record<string, unknown>>> {
    const valid = ids.map((id) => id.trim()).filter((id) => Types.ObjectId.isValid(id));
    if (valid.length === 0) {
      return [];
    }
    const objectIds = valid.map((id) => new Types.ObjectId(id));
    const docs = await this.mediaModel.find({ _id: { $in: objectIds } }).lean().exec();
    const byId = new Map(docs.map((d) => [String(d._id), d as unknown as Record<string, unknown>]));
    return valid.map((id) => byId.get(id)).filter((x): x is Record<string, unknown> => x !== undefined);
  }

  /** Delete media rows and try to remove files from disk (best-effort). */
  async deleteByIds(ids: string[]): Promise<void> {
    const valid = ids.map((id) => id.trim()).filter((id) => Types.ObjectId.isValid(id));
    if (valid.length === 0) return;
    const objectIds = valid.map((id) => new Types.ObjectId(id));
    const docs = await this.mediaModel.find({ _id: { $in: objectIds } }).lean().exec();
    for (const d of docs) {
      const p = typeof d.path === 'string' ? d.path : '';
      if (p && existsSync(p)) {
        try {
          await unlink(p);
        } catch {
          /* ignore */
        }
      }
    }
    await this.mediaModel.deleteMany({ _id: { $in: objectIds } }).exec();
  }
}
