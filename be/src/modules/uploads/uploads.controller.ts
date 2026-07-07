import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { relative, join } from 'path';

import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/enums/user.enums';
import { documentUploadOptions } from './uploads.config';

@Controller('uploads')
export class UploadsController {
  @Post('documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10, documentUploadOptions))
  uploadDocuments(
    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file');
    }

    const uploadRoot = join(process.cwd(), 'uploads');

    return {
      items: files.map((file) => {
        const relativePath = relative(uploadRoot, file.path).replaceAll(
          '\\',
          '/',
        );

        return {
          url: `/uploads/${relativePath}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      }),
    };
  }
}
