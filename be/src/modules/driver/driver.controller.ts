import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enums';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from 'src/common/decorators/current-user.decorator';

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('trips')
  @Roles(UserRole.DRIVER)
  getMyTrips(
    @Query('date') date: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.driverService.getMyTrips(date, currentUser);
  }
}