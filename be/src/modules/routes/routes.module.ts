import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportRoute } from './entities/route.entity';
import { RouteDriverAssignment } from './entities/route-driver-assignment.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransportRoute,
      RouteDriverAssignment,
      Company,
      User,
    ]),
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
