import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from 'src/enums/trip-status.enum';

export class CreateTripDto {
  @ApiProperty({
    example: 'uuid-route-id',
  })
  @IsUUID()
  routeId: string;

  @ApiProperty({
    example: 'uuid-vehicle-id',
  })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({
    example: 'uuid-driver-id',
    description:
      'Nếu không truyền, hệ thống sẽ lấy tài xế đã được phân cho xe trong ngày khởi hành.',
  })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({
    example: '2026-06-10T08:00:00+07:00',
  })
  @IsDateString()
  departureTime: string;

  @ApiPropertyOptional({
    example: '2026-06-10T11:00:00+07:00',
  })
  @IsOptional()
  @IsDateString()
  expectedArrivalTime?: string;

  @ApiPropertyOptional({
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  totalSeats?: number;

  @ApiPropertyOptional({
    example: 250000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    enum: TripStatus,
    example: TripStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropoffNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}