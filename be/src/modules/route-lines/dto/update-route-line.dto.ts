import { PartialType } from '@nestjs/swagger';
import { CreateRouteLineDto } from './create-route-line.dto';

export class UpdateRouteLineDto extends PartialType(CreateRouteLineDto) {}
