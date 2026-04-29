import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadPath = './uploads';
if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
}

export const multerConfig = {
  storage: diskStorage({
    destination: uploadPath,
    filename: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(null, uniqueSuffix + extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
};
