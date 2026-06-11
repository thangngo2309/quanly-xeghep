import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RouteDirection } from 'src/enums/route-direction.enum';

export class AvailableBookingTimesQueryDto {
  @ApiProperty({
    example: 'uuid-route-line-id',
  })
  @IsUUID()
  routeLineId: string;

  @ApiProperty({
    enum: RouteDirection,
    example: RouteDirection.OUTBOUND,
  })
  @IsEnum(RouteDirection)
  direction: RouteDirection;

  @ApiProperty({
    example: '2026-06-11',
  })
  @IsDateString()
  travelDate: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  passengerCount?: number;
}