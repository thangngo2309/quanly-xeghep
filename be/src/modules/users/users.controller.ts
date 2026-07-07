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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserRole } from 'src/enums/user.enums';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CreateOwnerOperatorDto } from './dto/create-owner-operator.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() currentUser: CurrentUserData) {
    return this.usersService.findByIdOrFail(currentUser.userId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.findAll(query, currentUser);
  }

  @Post('owner-operator')
  @Roles(UserRole.SUPER_ADMIN)
  createOwnerOperator(
    @Body() dto: CreateOwnerOperatorDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.createOwnerOperator(dto, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
    return this.usersService.remove(id, currentUser);
  }
}
