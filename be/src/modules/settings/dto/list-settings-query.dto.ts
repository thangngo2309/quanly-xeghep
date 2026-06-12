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
import { SettingGroup, SettingStatus, SettingValueType } from 'src/enums/setting.enum';

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

export class ListSettingsQueryDto {
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

  @ApiPropertyOptional({ example: 'hotline' })
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

  @ApiPropertyOptional({ enum: SettingGroup })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(SettingGroup)
  group?: SettingGroup;

  @ApiPropertyOptional({ enum: SettingValueType })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(SettingValueType)
  valueType?: SettingValueType;

  @ApiPropertyOptional({ enum: SettingStatus })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @ApiPropertyOptional({ example: 'createdAt' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsIn(['code', 'name', 'group', 'valueType', 'status', 'createdAt', 'updatedAt'])
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