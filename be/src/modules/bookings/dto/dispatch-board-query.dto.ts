import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsUUID, Matches } from 'class-validator';
import { RouteDirection } from 'src/enums/route-line.enum';

export class DispatchBoardQueryDto {
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
    example: '2026-06-14',
  })
  @IsDateString()
  travelDate: string;

  @ApiProperty({
    example: '05:00',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  preferredTime: string;
}