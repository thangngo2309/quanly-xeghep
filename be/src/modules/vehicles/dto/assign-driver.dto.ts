import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    example: 'uuid-driver-id',
  })
  @IsUUID()
  driverId: string;

  @ApiProperty({
    example: '2026-06-10',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}