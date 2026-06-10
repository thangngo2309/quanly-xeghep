import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingStatus } from 'src/enums/booking-status.enum';

export class CreateBookingDto {
  @ApiProperty({
    example: 'uuid-trip-id',
  })
  @IsUUID()
  tripId: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @MaxLength(255)
  customerName: string;

  @ApiProperty({
    example: '0901234567',
  })
  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  passengerCount?: number;

  @ApiPropertyOptional({
    example: '12 Nguyễn Huệ, Huế',
  })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional({
    example: 'Bến xe trung tâm Đà Nẵng',
  })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropoffNote?: string;

  @ApiPropertyOptional({
    example: 250000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  seatPrice?: number;

  @ApiPropertyOptional({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}