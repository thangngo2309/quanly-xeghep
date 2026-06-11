import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRouteScheduleTemplateDto } from './dto/create-route-schedule-template.dto';
import { CreateRouteScheduleVehicleDto } from './dto/create-route-schedule-vehicle.dto';
import { GenerateTripsDto } from './dto/generate-trips.dto';
import { ListRouteSchedulesQueryDto } from './dto/list-route-schedules-query.dto';
import { RouteSchedulesService } from './route-schedules.service';
import { UserRole } from 'src/enums/user.enums';

@ApiTags('Route Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('route-schedules')
export class RouteSchedulesController {
  constructor(private readonly routeSchedulesService: RouteSchedulesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createDto: CreateRouteScheduleTemplateDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.create(createDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: ListRouteSchedulesQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.findAll(query, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.findOne(id, currentUser);
  }

  @Post(':id/vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  addVehicle(
    @Param('id') id: string,
    @Body() dto: CreateRouteScheduleVehicleDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.addVehicle(id, dto, currentUser);
  }

  @Delete(':id/vehicles/:scheduleVehicleId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  removeVehicle(
    @Param('id') id: string,
    @Param('scheduleVehicleId') scheduleVehicleId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.removeVehicle(
      id,
      scheduleVehicleId,
      currentUser,
    );
  }

  @Post(':id/generate-trips')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  generateTrips(
    @Param('id') id: string,
    @Body() dto: GenerateTripsDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.generateTrips(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeSchedulesService.remove(id, currentUser);
  }
}