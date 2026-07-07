import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from 'src/enums/user.enums';

export class CreateUserDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '0901234567',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '12345678',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'uuid-company-id',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    type: [String],
    example: [
      '/uploads/documents/2026/07/bang-lai-mat-truoc.jpg',
      '/uploads/documents/2026/07/bang-lai-mat-sau.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Vui lòng tải giấy phép lái xe',
  })
  @ArrayMaxSize(6, {
    message: 'Chỉ được tải tối đa 6 file giấy phép lái xe',
  })
  @IsString({
    each: true,
  })
  @Matches(/^\/uploads\/documents\//, {
    each: true,
    message: 'Đường dẫn file giấy phép lái xe không hợp lệ',
  })
  driverLicenseDocuments?: string[];
}
