import { Module } from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { RouteSchedulesController } from './route-schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { VehicleDriverAssignment } from '../vehicles/entities/vehicle-driver-assignment.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Company } from '../companies/entities/company.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TransportRoute } from '../routes/entities/route.entity';
import { RouteLine } from '../route-lines/entities/route-line.entity';
import { RouteScheduleVehicle } from './entities/route-schedule-vehicle.entity';
import { RouteScheduleTemplate } from './entities/route-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RouteScheduleTemplate,
      RouteScheduleVehicle,
      RouteLine,
      TransportRoute,
      Trip,
      Company,
      Vehicle,
      VehicleDriverAssignment,
      User,
    ]),
  ],
  controllers: [RouteSchedulesController],
  providers: [RouteSchedulesService],
  exports: [RouteSchedulesService],
})
export class RouteSchedulesModule {}
