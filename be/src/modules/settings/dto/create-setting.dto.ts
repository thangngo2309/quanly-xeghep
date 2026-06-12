import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SettingGroup, SettingStatus, SettingValueType } from 'src/enums/setting.enum';

export class CreateSettingDto {
  @ApiProperty({
    example: 'SYSTEM_HOTLINE',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    example: 'Hotline hệ thống',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    enum: SettingGroup,
    example: SettingGroup.CONTACT,
  })
  @IsOptional()
  @IsEnum(SettingGroup)
  group?: SettingGroup;

  @ApiPropertyOptional({
    enum: SettingValueType,
    example: SettingValueType.STRING,
  })
  @IsOptional()
  @IsEnum(SettingValueType)
  valueType?: SettingValueType;

  @ApiPropertyOptional({
    example: '0900000000',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    example: 'Số hotline hiển thị trên hệ thống.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: SettingStatus,
    example: SettingStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}