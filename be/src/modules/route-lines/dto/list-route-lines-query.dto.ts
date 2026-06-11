import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RouteLineStatus } from 'src/enums/route-line-status.enum';

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

export class ListRouteLinesQueryDto {
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

  @ApiPropertyOptional({ example: 'Đà Nẵng' })
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

  @ApiPropertyOptional({ example: 'uuid-company-id' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: RouteLineStatus })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(RouteLineStatus)
  status?: RouteLineStatus;

  @ApiPropertyOptional({ example: 'createdAt' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsIn([
    'name',
    'startPoint',
    'endPoint',
    'status',
    'createdAt',
    'updatedAt',
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