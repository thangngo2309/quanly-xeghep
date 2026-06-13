import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteDirection } from 'src/enums/route-line.enum';

export class PublicAvailableTimesQueryDto {
  @IsUUID()
  routeLineId: string;

  @IsEnum(RouteDirection)
  direction: RouteDirection;

  @IsDateString()
  travelDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengerCount?: number;
}