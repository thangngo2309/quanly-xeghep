import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingStatus } from 'src/enums/booking.enum';
import { RouteDirection } from 'src/enums/route-line.enum';

export class CreateBookingDto {
  /**
   * Vẫn cho phép truyền tripId để tương thích API cũ.
   * Nhưng flow mới UI sẽ không dùng tripId nữa.
   */
  @ApiPropertyOptional({
    example: 'uuid-trip-id',
  })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  /**
   * Flow mới: chọn tuyến khai thác + chiều + ngày + giờ.
   * BE tự tìm trip phù hợp.
   */
  @ApiPropertyOptional({
    example: 'uuid-route-line-id',
  })
  @IsOptional()
  @IsUUID()
  routeLineId?: string;

  @ApiPropertyOptional({
    enum: RouteDirection,
    example: RouteDirection.OUTBOUND,
  })
  @IsOptional()
  @IsEnum(RouteDirection)
  direction?: RouteDirection;

  @ApiPropertyOptional({
    example: '2026-06-11',
  })
  @IsOptional()
  @IsDateString()
  travelDate?: string;

  @ApiPropertyOptional({
    example: '05:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  preferredTime?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @MaxLength(255)
  customerName: string;

  @ApiPropertyOptional({
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
    example: '12 Nguyễn Huệ, Đà Nẵng',
  })
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập địa điểm đón khách',
  })
  pickupAddress: string;

  @ApiPropertyOptional({
    example: 'Bến xe trung tâm Đà Nẵng',
  })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @ApiPropertyOptional({
    example: 16.047079,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  pickupLat?: number;

  @ApiPropertyOptional({
    example: 108.20623,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  pickupLng?: number;

  @ApiPropertyOptional({
    example: 16.463713,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  dropoffLat?: number;

  @ApiPropertyOptional({
    example: 107.590866,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  dropoffLng?: number;

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
