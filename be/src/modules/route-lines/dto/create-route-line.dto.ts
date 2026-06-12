import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RouteLineStatus } from 'src/enums/route-line.enum';

export class CreateRouteLineDto {
  @ApiPropertyOptional({
    example: 'uuid-company-id',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    example: 'Đà Nẵng ⇄ Huế',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    example: 'Đà Nẵng',
  })
  @IsString()
  @MaxLength(255)
  startPoint: string;

  @ApiProperty({
    example: 'Huế',
  })
  @IsString()
  @MaxLength(255)
  endPoint: string;

  @ApiPropertyOptional({
    example: ['Lăng Cô', 'Phú Bài'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  middleStops?: string[];

  @ApiPropertyOptional({
    example: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  defaultDurationMinutes?: number;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  defaultTurnaroundMinutes?: number;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  createReturnRoute?: boolean;

  @ApiPropertyOptional({
    enum: RouteLineStatus,
  })
  @IsOptional()
  @IsEnum(RouteLineStatus)
  status?: RouteLineStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}