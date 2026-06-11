import { PartialType } from '@nestjs/swagger';
import { CreateRouteScheduleDto } from './create-route-schedule.dto';

export class UpdateRouteScheduleDto extends PartialType(CreateRouteScheduleDto) {}
