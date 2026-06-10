import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { UserRole } from 'src/enums/user.enums';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.create(createVehicleDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: ListVehiclesQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.findAll(query, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.remove(id, currentUser);
  }

  @Post(':id/assign-driver')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.assignDriver(
      id,
      assignDriverDto,
      currentUser,
    );
  }

  @Get(':id/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAssignments(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.findAssignments(id, currentUser);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  removeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.vehiclesService.removeAssignment(
      id,
      assignmentId,
      currentUser,
    );
  }
}