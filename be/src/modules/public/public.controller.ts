import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
import { PublicAvailableTimesQueryDto } from './dto/public-available-times-query.dto';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('route-lines')
  getRouteLines(@Query('companyId') companyId: string) {
    return this.publicService.getRouteLines(companyId);
  }

  @Get('bookings/available-times')
  getAvailableTimes(@Query() query: PublicAvailableTimesQueryDto) {
    return this.publicService.getAvailableTimes(query);
  }

  @Post('bookings')
  createBooking(@Body() dto: CreatePublicBookingDto) {
    return this.publicService.createBooking(dto);
  }
}