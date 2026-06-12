import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MoveBookingTripDto {
  @ApiProperty({
    example: 'uuid-target-trip-id',
  })
  @IsUUID()
  targetTripId: string;

  @ApiPropertyOptional({
    example: 'Điều phối lại do điểm đón gần xe này hơn',
  })
  @IsOptional()
  @IsString()
  note?: string;
}