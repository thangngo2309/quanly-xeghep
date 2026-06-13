import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { RouteLine } from '../route-lines/entities/route-line.entity';
import { Trip } from '../trips/entities/trip.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TypeOrmModule.forFeature([RouteLine, Trip, Booking])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}