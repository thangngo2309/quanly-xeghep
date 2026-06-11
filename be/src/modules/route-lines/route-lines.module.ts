import { Module } from '@nestjs/common';
import { RouteLinesService } from './route-lines.service';
import { RouteLinesController } from './route-lines.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteLine } from './entities/route-line.entity';
import { TransportRoute } from '../routes/entities/route.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteLine, TransportRoute, Company])],
  controllers: [RouteLinesController],
  providers: [RouteLinesService],
  exports: [RouteLinesService],

})
export class RouteLinesModule {}
