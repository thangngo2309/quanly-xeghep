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
import { CreateRouteLineDto } from './dto/create-route-line.dto';
import { ListRouteLinesQueryDto } from './dto/list-route-lines-query.dto';
import { UpdateRouteLineDto } from './dto/update-route-line.dto';
import { RouteLinesService } from './route-lines.service';
import { UserRole } from 'src/enums/user.enums';

@ApiTags('Route Lines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('route-lines')
export class RouteLinesController {
  constructor(private readonly routeLinesService: RouteLinesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createRouteLineDto: CreateRouteLineDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeLinesService.create(createRouteLineDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: ListRouteLinesQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeLinesService.findAll(query, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeLinesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRouteLineDto: UpdateRouteLineDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeLinesService.update(id, updateRouteLineDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.routeLinesService.remove(id, currentUser);
  }
}