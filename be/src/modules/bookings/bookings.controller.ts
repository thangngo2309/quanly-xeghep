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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserRole } from 'src/enums/user.enums';
import { AvailableBookingTimesQueryDto } from './dto/available-booking-times-query.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.bookingsService.create(createBookingDto, currentUser);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DRIVER)
  findAll(
    @Query() query: ListBookingsQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.bookingsService.findAll(query, currentUser);
  }

  @Get('available-times')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAvailableTimes(
    @Query() query: AvailableBookingTimesQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.bookingsService.findAvailableTimes(query, currentUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DRIVER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.bookingsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.bookingsService.update(id, updateBookingDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
    return this.bookingsService.remove(id, currentUser);
  }
}
