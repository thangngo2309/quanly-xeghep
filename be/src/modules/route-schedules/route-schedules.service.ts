import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { RouteLine } from '../route-lines/entities/route-line.entity';
import { TransportRoute } from '../routes/entities/route.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { VehicleDriverAssignment } from '../vehicles/entities/vehicle-driver-assignment.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateRouteScheduleTemplateDto } from './dto/create-route-schedule-template.dto';
import { CreateRouteScheduleVehicleDto } from './dto/create-route-schedule-vehicle.dto';
import { GenerateTripsDto } from './dto/generate-trips.dto';
import { ListRouteSchedulesQueryDto } from './dto/list-route-schedules-query.dto';
import { RouteScheduleVehicle } from './entities/route-schedule-vehicle.entity';
import { RouteScheduleTemplate } from './entities/route-schedule.entity';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { VehicleStatus } from 'src/enums/vehicle-type.enum';
import { TripStatus } from 'src/enums/trip.enum';
import { RouteDirection, RouteLineStatus } from 'src/enums/route-line.enum';
import { RouteScheduleStatus } from 'src/enums/route-schedule.enum';

@Injectable()
export class RouteSchedulesService {
  constructor(
    @InjectRepository(RouteScheduleTemplate)
    private readonly scheduleRepository: Repository<RouteScheduleTemplate>,

    @InjectRepository(RouteScheduleVehicle)
    private readonly scheduleVehicleRepository: Repository<RouteScheduleVehicle>,

    @InjectRepository(RouteLine)
    private readonly routeLineRepository: Repository<RouteLine>,

    @InjectRepository(TransportRoute)
    private readonly routeRepository: Repository<TransportRoute>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(VehicleDriverAssignment)
    private readonly vehicleAssignmentRepository: Repository<VehicleDriverAssignment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private assertAdminHasCompany(currentUser: CurrentUserData) {
    if (currentUser.role === UserRole.ADMIN && !currentUser.companyId) {
      throw new ForbiddenException('Tài khoản admin chưa được gán nhà xe');
    }
  }

  private assertCanAccessCompany(
    currentUser: CurrentUserData,
    companyId: string,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      return;
    }

    this.assertAdminHasCompany(currentUser);

    if (currentUser.companyId !== companyId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác dữ liệu của nhà xe khác',
      );
    }
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);

    return hour * 60 + minute;
  }

  private dateTimeInVietnam(dateString: string, minutesFromStartOfDay: number) {
    const base = new Date(`${dateString}T00:00:00+07:00`);

    return new Date(base.getTime() + minutesFromStartOfDay * 60 * 1000);
  }

  private getTodayDateString() {
    const now = new Date();
    const vietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    return vietnamNow.toISOString().slice(0, 10);
  }

  private addDays(dateString: string, days: number) {
    const date = new Date(`${dateString}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().slice(0, 10);
  }

  private listDates(fromDate: string, toDate: string) {
    const dates: string[] = [];
    let current = fromDate;

    while (current <= toDate) {
      dates.push(current);
      current = this.addDays(current, 1);
    }

    return dates;
  }

  private getVietnamDayOfWeek(dateString: string) {
    const date = new Date(`${dateString}T12:00:00+07:00`);

    return date.getUTCDay();
  }

  private async getScheduleOrFail(id: string, currentUser: CurrentUserData) {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
        routeLine: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch chạy tuyến');
    }

    this.assertCanAccessCompany(currentUser, schedule.companyId);

    return schedule;
  }

  private async resolveVehicleDriver(vehicleId: string, date: string) {
    const exactAssignment = await this.vehicleAssignmentRepository.findOne({
      where: {
        vehicleId,
        date,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (exactAssignment?.driverId) {
      return exactAssignment.driverId;
    }

    const latestAssignment = await this.vehicleAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('assignment.date <= :date', { date })
      .orderBy('assignment.date', 'DESC')
      .addOrderBy('assignment.created_at', 'DESC')
      .getOne();

    return latestAssignment?.driverId || null;
  }

  private async validateVehicle(vehicleId: string, companyId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Xe không tồn tại');
    }

    if (vehicle.companyId !== companyId) {
      throw new BadRequestException('Xe không thuộc nhà xe của lịch chạy');
    }

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException('Xe không ở trạng thái hoạt động');
    }

    return vehicle;
  }

  private async validateDriver(driverId: string, companyId: string) {
    const driver = await this.userRepository.findOne({
      where: {
        id: driverId,
      },
    });

    if (!driver) {
      throw new BadRequestException('Tài xế không tồn tại');
    }

    if (driver.role !== UserRole.DRIVER) {
      throw new BadRequestException('Người được chọn không phải là tài xế');
    }

    if (driver.companyId !== companyId) {
      throw new BadRequestException('Tài xế không thuộc nhà xe của lịch chạy');
    }

    if (driver.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Tài xế không ở trạng thái hoạt động');
    }

    return driver;
  }

  private async hasVehicleOrDriverConflict(params: {
    vehicleId: string;
    driverId: string;
    departureTime: Date;
    expectedArrivalTime: Date;
    excludeTripId?: string;
  }) {
    const qb = this.tripRepository
      .createQueryBuilder('trip')
      .where('(trip.vehicle_id = :vehicleId OR trip.driver_id = :driverId)', {
        vehicleId: params.vehicleId,
        driverId: params.driverId,
      })
      .andWhere('trip.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [TripStatus.CANCELED, TripStatus.COMPLETED],
      })
      .andWhere('trip.departure_time < :expectedArrivalTime', {
        expectedArrivalTime: params.expectedArrivalTime,
      })
      .andWhere(
        '(trip.expected_arrival_time IS NULL OR trip.expected_arrival_time > :departureTime)',
        {
          departureTime: params.departureTime,
        },
      );

    if (params.excludeTripId) {
      qb.andWhere('trip.id != :excludeTripId', {
        excludeTripId: params.excludeTripId,
      });
    }

    const count = await qb.getCount();

    return count > 0;
  }

  async create(
    dto: CreateRouteScheduleTemplateDto,
    currentUser: CurrentUserData,
  ) {
    const routeLine = await this.routeLineRepository.findOne({
      where: {
        id: dto.routeLineId,
      },
    });

    if (!routeLine) {
      throw new BadRequestException('Tuyến khai thác không tồn tại');
    }

    if (routeLine.status !== RouteLineStatus.ACTIVE) {
      throw new BadRequestException('Tuyến khai thác không hoạt động');
    }

    this.assertCanAccessCompany(currentUser, routeLine.companyId);

    const startMinutes = this.timeToMinutes(dto.startTime);
    const endMinutes = this.timeToMinutes(dto.endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
    }

    const name =
      dto.name?.trim() ||
      `Lịch ${routeLine.name} ${dto.startTime} - ${dto.endTime}`;

    const schedule = this.scheduleRepository.create({
      companyId: routeLine.companyId,
      routeLineId: routeLine.id,
      name,
      startTime: dto.startTime,
      endTime: dto.endTime,
      headwayMinutes: dto.headwayMinutes,
      outboundDurationMinutes: dto.outboundDurationMinutes,
      returnDurationMinutes: dto.returnDurationMinutes,
      turnaroundAtEndMinutes: dto.turnaroundAtEndMinutes ?? 30,
      turnaroundAtStartMinutes: dto.turnaroundAtStartMinutes ?? 30,
      daysOfWeek: [...new Set(dto.daysOfWeek)],
      generateDaysAhead: dto.generateDaysAhead || 15,
      defaultBasePrice:
        dto.defaultBasePrice !== undefined && dto.defaultBasePrice !== null
          ? String(dto.defaultBasePrice)
          : null,
      defaultTripStatus: dto.defaultTripStatus || TripStatus.OPEN,
      status: dto.status || RouteScheduleStatus.ACTIVE,
      note: dto.note || null,
    });

    return this.scheduleRepository.save(schedule);
  }

  async findAll(
    query: ListRouteSchedulesQueryDto,
    currentUser: CurrentUserData,
  ) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      name: 'schedule.name',
      startTime: 'schedule.start_time',
      endTime: 'schedule.end_time',
      status: 'schedule.status',
      createdAt: 'schedule.created_at',
      updatedAt: 'schedule.updated_at',
    };

    const qb = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.company', 'company')
      .leftJoinAndSelect('schedule.routeLine', 'routeLine');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          schedule.name ILIKE :keyword
          OR routeLine.name ILIKE :keyword
          OR company.name ILIKE :keyword
          OR company.code ILIKE :keyword
        )
        `,
        {
          keyword,
        },
      );
    }

    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);

      qb.andWhere('schedule.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (query.companyId) {
      qb.andWhere('schedule.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.routeLineId) {
      qb.andWhere('schedule.route_line_id = :routeLineId', {
        routeLineId: query.routeLineId,
      });
    }

    if (query.status) {
      qb.andWhere('schedule.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'schedule.created_at',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: CurrentUserData) {
    const schedule = await this.getScheduleOrFail(id, currentUser);

    const vehicles = await this.scheduleVehicleRepository.find({
      where: {
        scheduleId: schedule.id,
      },
      relations: {
        vehicle: true,
        driver: true,
      },
      order: {
        firstDepartureTime: 'ASC',
      },
    });

    return {
      ...schedule,
      vehicles,
    };
  }

  async addVehicle(
    scheduleId: string,
    dto: CreateRouteScheduleVehicleDto,
    currentUser: CurrentUserData,
  ) {
    const schedule = await this.getScheduleOrFail(scheduleId, currentUser);

    const vehicle = await this.validateVehicle(
      dto.vehicleId,
      schedule.companyId,
    );

    if (dto.driverId) {
      await this.validateDriver(dto.driverId, schedule.companyId);
    }

    const scheduleVehicle = this.scheduleVehicleRepository.create({
      companyId: schedule.companyId,
      scheduleId: schedule.id,
      vehicleId: vehicle.id,
      driverId: dto.driverId || null,
      startDirection: dto.startDirection,
      firstDepartureTime: dto.firstDepartureTime,
      activeFrom: dto.activeFrom,
      activeTo: dto.activeTo || null,
      status: dto.status || RouteScheduleStatus.ACTIVE,
      note: dto.note || null,
    });

    return this.scheduleVehicleRepository.save(scheduleVehicle);
  }

  async removeVehicle(
    scheduleId: string,
    scheduleVehicleId: string,
    currentUser: CurrentUserData,
  ) {
    const schedule = await this.getScheduleOrFail(scheduleId, currentUser);

    const scheduleVehicle = await this.scheduleVehicleRepository.findOne({
      where: {
        id: scheduleVehicleId,
        scheduleId: schedule.id,
      },
    });

    if (!scheduleVehicle) {
      throw new NotFoundException('Không tìm thấy xe trong lịch chạy');
    }

    await this.scheduleVehicleRepository.remove(scheduleVehicle);

    return {
      message: 'Xóa xe khỏi vòng quay thành công',
    };
  }

  async generateTrips(
    scheduleId: string,
    dto: GenerateTripsDto,
    currentUser: CurrentUserData,
  ) {
    const schedule = await this.getScheduleOrFail(scheduleId, currentUser);

    if (schedule.status !== RouteScheduleStatus.ACTIVE) {
      throw new BadRequestException('Lịch chạy tuyến không hoạt động');
    }

    const outboundRoute = await this.routeRepository.findOne({
      where: {
        routeLineId: schedule.routeLineId,
        direction: RouteDirection.OUTBOUND,
      },
    });

    const returnRoute = await this.routeRepository.findOne({
      where: {
        routeLineId: schedule.routeLineId,
        direction: RouteDirection.RETURN,
      },
    });

    if (!outboundRoute || !returnRoute) {
      throw new BadRequestException(
        'Tuyến khai thác chưa có đủ chiều đi và chiều về',
      );
    }

    const fromDate = dto.fromDate || this.getTodayDateString();
    const toDate =
      dto.toDate || this.addDays(fromDate, schedule.generateDaysAhead - 1);

    const scheduleVehicles = await this.scheduleVehicleRepository.find({
      where: {
        scheduleId: schedule.id,
        status: RouteScheduleStatus.ACTIVE,
      },
      relations: {
        vehicle: true,
        driver: true,
      },
      order: {
        firstDepartureTime: 'ASC',
      },
    });

    if (scheduleVehicles.length === 0) {
      throw new BadRequestException('Lịch chạy chưa có xe tham gia vòng quay');
    }

    const dates = this.listDates(fromDate, toDate);

    const startMinutes = this.timeToMinutes(schedule.startTime);
    const endMinutes = this.timeToMinutes(schedule.endTime);

    let createdCount = 0;
    let skippedCount = 0;
    let updatedDriverCount = 0;

    const skipped: Array<{
      date: string;
      scheduleVehicleId: string;
      reason: string;
    }> = [];

    for (const date of dates) {
      const dayOfWeek = this.getVietnamDayOfWeek(date);

      if (!schedule.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }

      const activeVehicles = scheduleVehicles.filter((item) => {
        if (item.activeFrom > date) return false;
        if (item.activeTo && item.activeTo < date) return false;

        return true;
      });

      for (const scheduleVehicle of activeVehicles) {
        const vehicle = scheduleVehicle.vehicle;

        if (!vehicle || vehicle.status !== VehicleStatus.ACTIVE) {
          skippedCount += 1;
          skipped.push({
            date,
            scheduleVehicleId: scheduleVehicle.id,
            reason: 'Xe không hoạt động',
          });
          continue;
        }

        let currentDirection = scheduleVehicle.startDirection;
        let currentMinutes = this.timeToMinutes(
          scheduleVehicle.firstDepartureTime,
        );

        while (currentMinutes <= endMinutes) {
          if (currentMinutes >= startMinutes) {
            const route =
              currentDirection === RouteDirection.OUTBOUND
                ? outboundRoute
                : returnRoute;

            const durationMinutes =
              currentDirection === RouteDirection.OUTBOUND
                ? schedule.outboundDurationMinutes
                : schedule.returnDurationMinutes;

            const departureTime = this.dateTimeInVietnam(date, currentMinutes);

            const expectedArrivalTime = this.dateTimeInVietnam(
              date,
              currentMinutes + durationMinutes,
            );

            const driverId =
              scheduleVehicle.driverId ||
              (await this.resolveVehicleDriver(vehicle.id, date));

            if (!driverId) {
              skippedCount += 1;
              skipped.push({
                date,
                scheduleVehicleId: scheduleVehicle.id,
                reason:
                  'Chưa có tài xế. Hãy gán tài xế cho xe trong lịch hoặc phân tài xế cho xe theo ngày',
              });

              currentMinutes +=
                durationMinutes +
                (currentDirection === RouteDirection.OUTBOUND
                  ? schedule.turnaroundAtEndMinutes
                  : schedule.turnaroundAtStartMinutes);

              currentDirection =
                currentDirection === RouteDirection.OUTBOUND
                  ? RouteDirection.RETURN
                  : RouteDirection.OUTBOUND;

              continue;
            }

            await this.validateDriver(driverId, schedule.companyId);

            const generationKey = [
              schedule.id,
              scheduleVehicle.id,
              date,
              currentDirection,
              currentMinutes,
            ].join(':');

            const existedTrip = await this.tripRepository.findOne({
              where: {
                generationKey,
              },
            });
            
            if (existedTrip) {
              /**
               * Chuyến đã sinh rồi nhưng tài xế có thể đã thay đổi sau đó.
               * Ví dụ: xe 43A-12345 trước dùng test tx, sau đổi sang tx2.
               * Nếu không sync lại, xe khác dùng test tx sẽ bị conflict và không sinh được chuyến.
               */
              if (
                existedTrip.driverId !== driverId &&
                ![TripStatus.COMPLETED, TripStatus.CANCELED].includes(existedTrip.status)
              ) {
                const hasConflict = await this.hasVehicleOrDriverConflict({
                  vehicleId: vehicle.id,
                  driverId,
                  departureTime,
                  expectedArrivalTime,
                  excludeTripId: existedTrip.id,
                });
            
                if (hasConflict) {
                  skippedCount += 1;
                  skipped.push({
                    date,
                    scheduleVehicleId: scheduleVehicle.id,
                    reason:
                      'Chuyến đã tồn tại nhưng không thể cập nhật tài xế vì tài xế mới đang bị trùng lịch',
                  });
                } else {
                  existedTrip.driverId = driverId;
            
                  await this.tripRepository.save(existedTrip);
            
                  updatedDriverCount += 1;
                }
              } else {
                skippedCount += 1;
                skipped.push({
                  date,
                  scheduleVehicleId: scheduleVehicle.id,
                  reason: 'Chuyến đã được sinh trước đó',
                });
              }
            } else {
              const hasConflict = await this.hasVehicleOrDriverConflict({
                vehicleId: vehicle.id,
                driverId,
                departureTime,
                expectedArrivalTime,
              });
            
              if (hasConflict) {
                skippedCount += 1;
                skipped.push({
                  date,
                  scheduleVehicleId: scheduleVehicle.id,
                  reason: 'Xe hoặc tài xế bị trùng lịch',
                });
              } else {
                const trip = this.tripRepository.create({
                  tripCode: `AUTO-${Date.now()}-${Math.floor(
                    100000 + Math.random() * 900000,
                  )}`,
                  companyId: schedule.companyId,
                  routeId: route.id,
                  routeLineId: schedule.routeLineId,
                  direction: currentDirection,
                  vehicleId: vehicle.id,
                  driverId,
                  departureTime,
                  expectedArrivalTime,
                  totalSeats: vehicle.seatCount,
                  bookedSeats: 0,
                  basePrice: schedule.defaultBasePrice,
                  status: schedule.defaultTripStatus || TripStatus.OPEN,
                  pickupNote: null,
                  dropoffNote: null,
                  note: `Tự sinh từ lịch chạy: ${schedule.name}`,
                  scheduleTemplateId: schedule.id,
                  scheduleVehicleId: scheduleVehicle.id,
                  autoGenerated: true,
                  generationKey,
                });
            
                await this.tripRepository.save(trip);
                createdCount += 1;
              }
            }
          }

          const durationMinutes =
            currentDirection === RouteDirection.OUTBOUND
              ? schedule.outboundDurationMinutes
              : schedule.returnDurationMinutes;

          const turnaroundMinutes =
            currentDirection === RouteDirection.OUTBOUND
              ? schedule.turnaroundAtEndMinutes
              : schedule.turnaroundAtStartMinutes;

          currentMinutes += durationMinutes + turnaroundMinutes;

          currentDirection =
            currentDirection === RouteDirection.OUTBOUND
              ? RouteDirection.RETURN
              : RouteDirection.OUTBOUND;
        }
      }
    }

    return {
      message: 'Sinh lịch chuyến hoàn tất',
      createdCount,
      updatedDriverCount,
      skippedCount,
      skipped,
    };
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const schedule = await this.getScheduleOrFail(id, currentUser);

    await this.scheduleRepository.remove(schedule);

    return {
      message: 'Xóa lịch chạy tuyến thành công',
    };
  }
}
