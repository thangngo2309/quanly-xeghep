import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RouteScheduleStatus } from 'src/enums/route-schedule-status.enum';
import { TripStatus } from 'src/enums/trip-status.enum';

export class CreateRouteScheduleTemplateDto {
  @ApiProperty({
    example: 'uuid-route-line-id',
  })
  @IsUUID()
  routeLineId: string;

  @ApiPropertyOptional({
    example: 'Lịch Đà Nẵng ⇄ Huế mỗi 60 phút',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    example: '05:00',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty({
    example: '20:00',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @ApiProperty({
    example: 60,
  })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  headwayMinutes: number;

  @ApiProperty({
    example: 150,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  outboundDurationMinutes: number;

  @ApiProperty({
    example: 150,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  returnDurationMinutes: number;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  turnaroundAtEndMinutes?: number;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  turnaroundAtStartMinutes?: number;

  @ApiProperty({
    example: [1, 2, 3, 4, 5, 6, 0],
    description: '0 là Chủ nhật, 1 là Thứ 2 ... 6 là Thứ 7',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];

  @ApiPropertyOptional({
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  generateDaysAhead?: number;

  @ApiPropertyOptional({
    example: 250000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultBasePrice?: number;

  @ApiPropertyOptional({
    enum: TripStatus,
    example: TripStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(TripStatus)
  defaultTripStatus?: TripStatus;

  @ApiPropertyOptional({
    enum: RouteScheduleStatus,
  })
  @IsOptional()
  @IsEnum(RouteScheduleStatus)
  status?: RouteScheduleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}