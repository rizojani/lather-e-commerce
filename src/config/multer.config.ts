import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const baseUploadPath = './uploads';
if (!existsSync(baseUploadPath)) {
  mkdirSync(baseUploadPath, { recursive: true });
}

const resolveFolderName = (req: Request, file: Express.Multer.File): string => {
  if (file.fieldname === 'profileImage') return 'profileImage';
  if (file.fieldname.toLowerCase().includes('product')) return 'product';

  const urlParts = req.baseUrl?.split('/').filter(Boolean) ?? [];
  const moduleName = urlParts[urlParts.length - 1];
  if (moduleName) return moduleName;

  return 'misc';
};

export const multerConfig = {
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
      const folderName = resolveFolderName(req, file);
      const targetPath = `${baseUploadPath}/${folderName}`;
      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true });
      }
      callback(null, targetPath);
    },
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
