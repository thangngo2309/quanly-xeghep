import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { RouteDirection } from 'src/enums/route-line.enum';
import { RouteScheduleStatus } from 'src/enums/route-schedule.enum';

export class CreateRouteScheduleVehicleDto {
  @ApiProperty({
    example: 'uuid-vehicle-id',
  })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({
    example: 'uuid-driver-id',
  })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({
    enum: RouteDirection,
    example: RouteDirection.OUTBOUND,
  })
  @IsEnum(RouteDirection)
  startDirection: RouteDirection;

  @ApiProperty({
    example: '05:00',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  firstDepartureTime: string;

  @ApiProperty({
    example: '2026-06-10',
  })
  @IsDateString()
  activeFrom: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  activeTo?: string;

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