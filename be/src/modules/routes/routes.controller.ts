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
import { AssignRouteDriverDto } from './dto/assign-route-driver.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { ListRoutesQueryDto } from './dto/list-routes-query.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';
import { UserRole } from 'src/enums/user.enums';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createRouteDto: CreateRouteDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.create(createRouteDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: ListRoutesQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.findAll(query, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.update(id, updateRouteDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.remove(id, currentUser);
  }

  @Post(':id/assign-driver')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignRouteDriverDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.assignDriver(id, assignDriverDto, currentUser);
  }

  @Get(':id/drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findDrivers(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.findDrivers(id, currentUser);
  }

  @Delete(':id/drivers/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  endDriverAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routesService.endDriverAssignment(
      id,
      assignmentId,
      currentUser,
    );
  }
}