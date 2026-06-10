import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { Company } from '../companies/entities/company.entity';
import { TransportRoute } from '../routes/entities/route.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleDriverAssignment } from '../vehicles/entities/vehicle-driver-assignment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip,
      Company,
      TransportRoute,
      Vehicle,
      VehicleDriverAssignment,
      User,
    ]),
  ],

  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
