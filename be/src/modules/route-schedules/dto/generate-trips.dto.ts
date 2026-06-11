import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GenerateTripsDto {
  @ApiPropertyOptional({
    example: '2026-06-10',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-20',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}