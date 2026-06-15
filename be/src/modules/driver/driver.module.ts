import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { Trip } from '../trips/entities/trip.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Booking])],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}