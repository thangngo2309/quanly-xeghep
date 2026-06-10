import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignRouteDriverDto {
  @ApiProperty({
    example: 'uuid-driver-id',
  })
  @IsUUID()
  driverId: string;

  @ApiPropertyOptional({
    example: '2026-06-10',
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}