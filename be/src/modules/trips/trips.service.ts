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
import { TransportRoute } from '../routes/entities/route.entity';
import { User } from '../users/entities/user.entity';
import { VehicleDriverAssignment } from '../vehicles/entities/vehicle-driver-assignment.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { TransportRouteStatus } from 'src/enums/transport-route-status.enum';
import { VehicleStatus } from 'src/enums/vehicle-type.enum';
import { TripStatus } from 'src/enums/trip-status.enum';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(TransportRoute)
    private readonly routeRepository: Repository<TransportRoute>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(VehicleDriverAssignment)
    private readonly vehicleAssignmentRepository: Repository<VehicleDriverAssignment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private getDateStringFromDate(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private generateTripCode(departureTime: Date) {
    const year = departureTime.getFullYear();
    const month = String(departureTime.getMonth() + 1).padStart(2, '0');
    const day = String(departureTime.getDate()).padStart(2, '0');

    const random = Math.floor(100000 + Math.random() * 900000);

    return `TRIP-${year}${month}${day}-${random}`;
  }

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

  private assertCanAccessTrip(currentUser: CurrentUserData, trip: Trip) {
    if (currentUser.role === UserRole.DRIVER) {
      if (trip.driverId !== currentUser.userId) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập chuyến xe này',
        );
      }

      return;
    }

    this.assertCanAccessCompany(currentUser, trip.companyId);
  }

  private async getRouteOrFail(routeId: string) {
    const route = await this.routeRepository.findOne({
      where: {
        id: routeId,
      },
    });

    if (!route) {
      throw new BadRequestException('Tuyến đường không tồn tại');
    }

    if (route.status !== TransportRouteStatus.ACTIVE) {
      throw new BadRequestException('Tuyến đường không ở trạng thái hoạt động');
    }

    return route;
  }

  private async getVehicleOrFail(vehicleId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Xe không tồn tại');
    }

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException('Xe không ở trạng thái hoạt động');
    }

    return vehicle;
  }

  private async getDriverOrFail(driverId: string) {
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

    if (driver.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Tài xế không ở trạng thái hoạt động');
    }

    return driver;
  }

  private async resolveDriverId(
    dtoDriverId: string | undefined,
    vehicleId: string,
    departureTime: Date,
  ) {
    if (dtoDriverId) {
      return dtoDriverId;
    }

    const departureDate = this.getDateStringFromDate(departureTime);

    const assignment = await this.vehicleAssignmentRepository.findOne({
      where: {
        vehicleId,
        date: departureDate,
      },
    });

    if (!assignment) {
      throw new BadRequestException(
        'Xe chưa được phân tài xế trong ngày khởi hành. Vui lòng chọn tài xế hoặc phân tài xế cho xe trước.',
      );
    }

    return assignment.driverId;
  }

  private async validateTripRelations(
    routeId: string,
    vehicleId: string,
    driverId: string,
    currentUser: CurrentUserData,
  ) {
    const route = await this.getRouteOrFail(routeId);
    const vehicle = await this.getVehicleOrFail(vehicleId);
    const driver = await this.getDriverOrFail(driverId);

    if (vehicle.companyId !== route.companyId) {
      throw new BadRequestException('Xe không thuộc cùng nhà xe với tuyến');
    }

    if (driver.companyId !== route.companyId) {
      throw new BadRequestException('Tài xế không thuộc cùng nhà xe với tuyến');
    }

    this.assertCanAccessCompany(currentUser, route.companyId);

    return {
      companyId: route.companyId,
      route,
      vehicle,
      driver,
    };
  }

  async create(dto: CreateTripDto, currentUser: CurrentUserData) {
    const departureTime = new Date(dto.departureTime);

    if (Number.isNaN(departureTime.getTime())) {
      throw new BadRequestException('Thời gian khởi hành không hợp lệ');
    }

    const driverId = await this.resolveDriverId(
      dto.driverId,
      dto.vehicleId,
      departureTime,
    );

    const { companyId, vehicle } = await this.validateTripRelations(
      dto.routeId,
      dto.vehicleId,
      driverId,
      currentUser,
    );

    const expectedArrivalTime = dto.expectedArrivalTime
      ? new Date(dto.expectedArrivalTime)
      : null;

    const totalSeats = dto.totalSeats || vehicle.seatCount;

    if (totalSeats > vehicle.seatCount) {
      throw new BadRequestException(
        'Số ghế chuyến xe không được lớn hơn số ghế của xe',
      );
    }

    const trip = this.tripRepository.create({
      tripCode: this.generateTripCode(departureTime),
      companyId,
      routeId: dto.routeId,
      vehicleId: dto.vehicleId,
      driverId,
      departureTime,
      expectedArrivalTime,
      totalSeats,
      bookedSeats: 0,
      basePrice:
        dto.basePrice !== undefined && dto.basePrice !== null
          ? String(dto.basePrice)
          : null,
      status: dto.status || TripStatus.SCHEDULED,
      pickupNote: dto.pickupNote || null,
      dropoffNote: dto.dropoffNote || null,
      note: dto.note || null,
    });

    const savedTrip = await this.tripRepository.save(trip);

    return this.findOne(savedTrip.id, currentUser);
  }

  async findAll(query: ListTripsQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'departureTime';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      tripCode: 'trip.trip_code',
      departureTime: 'trip.departure_time',
      expectedArrivalTime: 'trip.expected_arrival_time',
      totalSeats: 'trip.total_seats',
      bookedSeats: 'trip.booked_seats',
      basePrice: 'trip.base_price',
      status: 'trip.status',
      createdAt: 'trip.created_at',
      updatedAt: 'trip.updated_at',
    };

    const qb = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.company', 'company')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.driver', 'driver');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          trip.trip_code ILIKE :keyword
          OR route.name ILIKE :keyword
          OR route.origin ILIKE :keyword
          OR route.destination ILIKE :keyword
          OR vehicle.license_plate ILIKE :keyword
          OR driver.full_name ILIKE :keyword
          OR driver.phone ILIKE :keyword
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

      qb.andWhere('trip.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (currentUser.role === UserRole.DRIVER) {
      qb.andWhere('trip.driver_id = :driverId', {
        driverId: currentUser.userId,
      });
    } else if (query.companyId) {
      qb.andWhere('trip.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.routeId) {
      qb.andWhere('trip.route_id = :routeId', {
        routeId: query.routeId,
      });
    }

    if (query.vehicleId) {
      qb.andWhere('trip.vehicle_id = :vehicleId', {
        vehicleId: query.vehicleId,
      });
    }

    if (query.driverId && currentUser.role !== UserRole.DRIVER) {
      qb.andWhere('trip.driver_id = :driverId', {
        driverId: query.driverId,
      });
    }

    if (query.status) {
      qb.andWhere('trip.status = :status', {
        status: query.status,
      });
    }

    if (query.fromDate) {
      qb.andWhere('trip.departure_time >= :fromDate', {
        fromDate: `${query.fromDate}T00:00:00+07:00`,
      });
    }

    if (query.toDate) {
      qb.andWhere('trip.departure_time <= :toDate', {
        toDate: `${query.toDate}T23:59:59+07:00`,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'trip.departure_time',
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
    const trip = await this.tripRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
        route: true,
        vehicle: true,
        driver: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến xe');
    }

    this.assertCanAccessTrip(currentUser, trip);

    return trip;
  }

  async update(id: string, dto: UpdateTripDto, currentUser: CurrentUserData) {
    const trip = await this.findOne(id, currentUser);

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('Không được cập nhật chuyến xe đã hoàn thành');
    }

    const nextRouteId = dto.routeId || trip.routeId;
    const nextVehicleId = dto.vehicleId || trip.vehicleId;

    const nextDepartureTime = dto.departureTime
      ? new Date(dto.departureTime)
      : trip.departureTime;

    const nextDriverId = dto.driverId
      ? dto.driverId
      : await this.resolveDriverId(undefined, nextVehicleId, nextDepartureTime);

    const { companyId, vehicle } = await this.validateTripRelations(
      nextRouteId,
      nextVehicleId,
      nextDriverId,
      currentUser,
    );

    const nextTotalSeats =
      dto.totalSeats !== undefined ? dto.totalSeats : trip.totalSeats;

    if (nextTotalSeats < trip.bookedSeats) {
      throw new BadRequestException(
        'Số ghế không được nhỏ hơn số ghế đã đặt',
      );
    }

    if (nextTotalSeats > vehicle.seatCount) {
      throw new BadRequestException(
        'Số ghế chuyến xe không được lớn hơn số ghế của xe',
      );
    }

    trip.companyId = companyId;
    trip.routeId = nextRouteId;
    trip.vehicleId = nextVehicleId;
    trip.driverId = nextDriverId;
    trip.departureTime = nextDepartureTime;
    trip.totalSeats = nextTotalSeats;

    if (dto.expectedArrivalTime !== undefined) {
      trip.expectedArrivalTime = dto.expectedArrivalTime
        ? new Date(dto.expectedArrivalTime)
        : null;
    }

    if (dto.basePrice !== undefined) {
      trip.basePrice =
        dto.basePrice !== null ? String(dto.basePrice) : null;
    }

    if (dto.status !== undefined) {
      trip.status = dto.status;
    }

    if (dto.pickupNote !== undefined) {
      trip.pickupNote = dto.pickupNote || null;
    }

    if (dto.dropoffNote !== undefined) {
      trip.dropoffNote = dto.dropoffNote || null;
    }

    if (dto.note !== undefined) {
      trip.note = dto.note || null;
    }

    const savedTrip = await this.tripRepository.save(trip);

    return this.findOne(savedTrip.id, currentUser);
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const trip = await this.findOne(id, currentUser);

    if (trip.bookedSeats > 0) {
      throw new BadRequestException(
        'Không được xóa chuyến xe đã có booking',
      );
    }

    await this.tripRepository.remove(trip);

    return {
      message: 'Xóa chuyến xe thành công',
    };
  }
}