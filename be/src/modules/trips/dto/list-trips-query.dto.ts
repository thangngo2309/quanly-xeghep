import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TripStatus } from 'src/enums/trip.enum';

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

export class ListTripsQueryDto {
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

  @ApiPropertyOptional({ example: 'TRIP' })
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

  @ApiPropertyOptional({ example: 'uuid-route-id' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ example: 'uuid-vehicle-id' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'uuid-driver-id' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ enum: TripStatus })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-06-11' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'departureTime' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsIn([
    'tripCode',
    'departureTime',
    'expectedArrivalTime',
    'totalSeats',
    'bookedSeats',
    'basePrice',
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