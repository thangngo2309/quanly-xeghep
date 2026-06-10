import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransportRouteStatus } from 'src/enums/transport-route-status.enum';

export class CreateRouteDto {
  @ApiPropertyOptional({
    example: 'uuid-company-id',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    example: 'Huế - Đà Nẵng',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Huế',
  })
  @IsString()
  @MaxLength(255)
  origin: string;

  @ApiProperty({
    example: 'Đà Nẵng',
  })
  @IsString()
  @MaxLength(255)
  destination: string;

  @ApiPropertyOptional({
    example: ['Đà Nẵng', 'Hội An'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({
    each: true,
  })
  stops?: string[];

  @ApiPropertyOptional({
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  distanceKm?: number;

  @ApiPropertyOptional({
    example: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({
    enum: TransportRouteStatus,
    example: TransportRouteStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TransportRouteStatus)
  status?: TransportRouteStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}