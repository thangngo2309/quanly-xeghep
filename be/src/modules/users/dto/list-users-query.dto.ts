import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserRole, UserStatus } from 'src/enums/user.enums';

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => emptyToUndefined(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Transform(({ value }) => emptyToUndefined(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: '0900000000' })
  @Transform(({ value }) => {
    const normalized = emptyToUndefined(value);

    if (typeof normalized === 'string') {
      const trimmed = normalized.trim();
      return trimmed || undefined;
    }

    return normalized;
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'createdAt' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsIn([
    'fullName',
    'phone',
    'email',
    'role',
    'status',
    'createdAt',
    'updatedAt',
    'lastLoginAt',
  ])
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @Transform(({ value }) => {
    const normalized = emptyToUndefined(value);

    if (typeof normalized === 'string') {
      return normalized.toLowerCase();
    }

    return normalized;
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}