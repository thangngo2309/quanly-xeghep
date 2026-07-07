import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const documentUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const now = new Date();

      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const destination = join(
        process.cwd(),
        'uploads',
        'documents',
        year,
        month,
      );

      mkdirSync(destination, {
        recursive: true,
      });

      callback(null, destination);
    },

    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();

      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),

  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          'Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc file PDF',
        ),
        false,
      );

      return;
    }

    callback(null, true);
  },

  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024,
  },
};
