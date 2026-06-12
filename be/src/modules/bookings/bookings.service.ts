import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { Trip } from '../trips/entities/trip.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingDispatchStatus, BookingStatus } from 'src/enums/booking.enum';
import { UserRole } from 'src/enums/user.enums';
import { TripStatus } from 'src/enums/trip.enum';
import { AvailableBookingTimesQueryDto } from './dto/available-booking-times-query.dto';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { DispatchBoardQueryDto } from './dto/dispatch-board-query.dto';
import { MoveBookingTripDto } from './dto/move-booking-trip.dto';

type ResolveBookingTripResult = {
  trip: Trip;
  dispatchStatus: BookingDispatchStatus;
  dispatchNote: string | null;
};

@Injectable()
export class BookingsService {
  private readonly PICKUP_NEAR_RADIUS_KM = 5;
  private readonly PICKUP_WARNING_RADIUS_KM = 10;
  private readonly PICKUP_HARD_LIMIT_KM = 15;

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}
  
  private calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) {
    const earthRadiusKm = 6371;
  
    const toRad = (value: number) => (value * Math.PI) / 180;
  
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return earthRadiusKm * c;
  }
  
  private pickBestTripForBooking(params: {
    trips: Trip[];
    existingBookings: Booking[];
    pickupLat?: number;
    pickupLng?: number;
  }) {
    const { trips, existingBookings, pickupLat, pickupLng } = params;
  
    const bookingsByTripId = new Map<string, Booking[]>();
  
    for (const booking of existingBookings) {
      const current = bookingsByTripId.get(booking.tripId) || [];
      current.push(booking);
      bookingsByTripId.set(booking.tripId, current);
    }
  
    /**
     * Nếu booking mới chưa có tọa độ:
     * ưu tiên lấp đầy xe đã có khách trước để tránh mở xe mới không cần thiết.
     */
    if (
      pickupLat === undefined ||
      pickupLng === undefined ||
      pickupLat === null ||
      pickupLng === null
    ) {
      const trip = [...trips].sort((a, b) => {
        if (a.bookedSeats !== b.bookedSeats) {
          return b.bookedSeats - a.bookedSeats;
        }
  
        return a.createdAt.getTime() - b.createdAt.getTime();
      })[0];
  
      return {
        trip,
        dispatchStatus: BookingDispatchStatus.WARNING,
        dispatchNote:
          'Booking chưa có tọa độ điểm đón, hệ thống đã tự ghép vào xe phù hợp. Vui lòng kiểm tra nếu cần.',
      };
    }
  
    const scoredTrips = trips.map((trip) => {
      const bookings = bookingsByTripId.get(trip.id) || [];
  
      const pickupBookings = bookings.filter((booking) => {
        return (
          booking.pickupLat !== null &&
          booking.pickupLat !== undefined &&
          booking.pickupLng !== null &&
          booking.pickupLng !== undefined
        );
      });
  
      const nearestPickupDistanceKm =
        pickupBookings.length > 0
          ? Math.min(
              ...pickupBookings.map((booking) =>
                this.calculateDistanceKm(
                  pickupLat,
                  pickupLng,
                  Number(booking.pickupLat),
                  Number(booking.pickupLng),
                ),
              ),
            )
          : null;
  
      return {
        trip,
        bookings,
        hasCustomer: bookings.length > 0 || trip.bookedSeats > 0,
        nearestPickupDistanceKm,
        bookedSeats: trip.bookedSeats,
        availableSeats: trip.totalSeats - trip.bookedSeats,
      };
    });
  
    /**
     * 1. Có xe đã có khách gần trong 5km thì ghép vào xe đó.
     */
    const nearTrips = scoredTrips
      .filter(
        (item) =>
          item.nearestPickupDistanceKm !== null &&
          item.nearestPickupDistanceKm <= this.PICKUP_NEAR_RADIUS_KM,
      )
      .sort((a, b) => {
        if (
          Number(a.nearestPickupDistanceKm) !==
          Number(b.nearestPickupDistanceKm)
        ) {
          return (
            Number(a.nearestPickupDistanceKm) -
            Number(b.nearestPickupDistanceKm)
          );
        }
  
        return b.bookedSeats - a.bookedSeats;
      });
  
    if (nearTrips.length > 0) {
      const selected = nearTrips[0];
  
      return {
        trip: selected.trip,
        dispatchStatus: BookingDispatchStatus.AUTO_ASSIGNED,
        dispatchNote: `Tự ghép vì điểm đón gần cụm hiện tại khoảng ${Number(
          selected.nearestPickupDistanceKm,
        ).toFixed(1)}km.`,
      };
    }
  
    /**
     * 2. Nếu hơi xa nhưng vẫn trong 10km:
     * vẫn ghép vào xe đã có khách để tiết kiệm xe, nhưng cảnh báo admin.
     */
    const warningTrips = scoredTrips
      .filter(
        (item) =>
          item.hasCustomer &&
          item.nearestPickupDistanceKm !== null &&
          item.nearestPickupDistanceKm <= this.PICKUP_WARNING_RADIUS_KM,
      )
      .sort((a, b) => {
        if (a.bookedSeats !== b.bookedSeats) {
          return b.bookedSeats - a.bookedSeats;
        }
  
        return (
          Number(a.nearestPickupDistanceKm) -
          Number(b.nearestPickupDistanceKm)
        );
      });
  
    if (warningTrips.length > 0) {
      const selected = warningTrips[0];
  
      return {
        trip: selected.trip,
        dispatchStatus: BookingDispatchStatus.WARNING,
        dispatchNote: `Điểm đón cách cụm hiện tại khoảng ${Number(
          selected.nearestPickupDistanceKm,
        ).toFixed(
          1,
        )}km. Hệ thống vẫn ghép vào xe này để tối ưu số xe, admin có thể điều phối lại nếu cần.`,
      };
    }
  
    /**
     * 3. Nếu xa cụm hiện tại nhưng còn xe trống cùng giờ:
     * mở cụm mới bằng xe trống.
     */
    const emptyTrips = scoredTrips
      .filter((item) => !item.hasCustomer)
      .sort((a, b) => a.trip.createdAt.getTime() - b.trip.createdAt.getTime());
  
    if (emptyTrips.length > 0) {
      return {
        trip: emptyTrips[0].trip,
        dispatchStatus: BookingDispatchStatus.AUTO_ASSIGNED,
        dispatchNote:
          'Tự ghép vào xe trống để mở cụm đón mới vì điểm đón xa các cụm hiện tại.',
      };
    }
  
    /**
     * 4. Không còn xe trống, điểm đón xa:
     * vẫn gán vào xe còn phù hợp nhất để không mất booking,
     * nhưng đánh dấu cần admin kiểm tra.
     */
    const fallbackTrips = scoredTrips.sort((a, b) => {
      if (
        a.nearestPickupDistanceKm !== null &&
        b.nearestPickupDistanceKm !== null &&
        a.nearestPickupDistanceKm !== b.nearestPickupDistanceKm
      ) {
        return a.nearestPickupDistanceKm - b.nearestPickupDistanceKm;
      }
  
      return b.availableSeats - a.availableSeats;
    });
  
    const selected = fallbackTrips[0];
  
    return {
      trip: selected.trip,
      dispatchStatus:
        selected.nearestPickupDistanceKm !== null &&
        selected.nearestPickupDistanceKm > this.PICKUP_HARD_LIMIT_KM
          ? BookingDispatchStatus.MANUAL_REQUIRED
          : BookingDispatchStatus.WARNING,
      dispatchNote:
        selected.nearestPickupDistanceKm !== null
          ? `Điểm đón cách cụm gần nhất khoảng ${selected.nearestPickupDistanceKm.toFixed(
              1,
            )}km. Cần admin kiểm tra và điều phối nếu chưa hợp lý.`
          : 'Chuyến chưa có đủ dữ liệu tọa độ để đánh giá cụm điểm đón.',
    };
  }
  
  private getTripPickupStats(bookings: Booking[]) {
    const bookingsWithLocation = bookings.filter((booking) => {
      return (
        booking.pickupLat !== null &&
        booking.pickupLat !== undefined &&
        booking.pickupLng !== null &&
        booking.pickupLng !== undefined
      );
    });
  
    if (bookingsWithLocation.length === 0) {
      return {
        centerLat: null,
        centerLng: null,
        maxDistanceKm: null,
      };
    }
  
    const centerLat =
      bookingsWithLocation.reduce(
        (sum, booking) => sum + Number(booking.pickupLat),
        0,
      ) / bookingsWithLocation.length;
  
    const centerLng =
      bookingsWithLocation.reduce(
        (sum, booking) => sum + Number(booking.pickupLng),
        0,
      ) / bookingsWithLocation.length;
  
    const maxDistanceKm = Math.max(
      ...bookingsWithLocation.map((booking) =>
        this.calculateDistanceKm(
          centerLat,
          centerLng,
          Number(booking.pickupLat),
          Number(booking.pickupLng),
        ),
      ),
    );
  
    return {
      centerLat,
      centerLng,
      maxDistanceKm,
    };
  }

  private buildVietnamDateTime(dateString: string, timeString: string) {
    return new Date(`${dateString}T${timeString}:00+07:00`);
  }

  private getVietnamDateRange(dateString: string) {
    return {
      start: new Date(`${dateString}T00:00:00+07:00`),
      end: new Date(`${dateString}T23:59:59+07:00`),
    };
  }

  private formatTimeInVietnam(value: Date) {
    const vietnamDate = new Date(value.getTime() + 7 * 60 * 60 * 1000);
    return vietnamDate.toISOString().slice(11, 16);
  }

  private async resolveTripForBooking(
    dto: CreateBookingDto,
    currentUser: CurrentUserData,
    passengerCount: number,
    manager: EntityManager,
  ): Promise<ResolveBookingTripResult> {
    const tripRepository = manager.getRepository(Trip);
  
    /**
     * Trường hợp admin chọn trực tiếp 1 chuyến xe.
     * Đây được xem là gán thủ công.
     */
    if (dto.tripId) {
      const trip = await tripRepository.findOne({
        where: {
          id: dto.tripId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
  
      if (!trip) {
        throw new BadRequestException('Chuyến xe không tồn tại');
      }
  
      this.assertCanAccessCompany(currentUser, trip.companyId);
      this.assertTripCanReceiveBooking(trip);
  
      const availableSeats = Number(trip.totalSeats) - Number(trip.bookedSeats);
  
      if (availableSeats < passengerCount) {
        throw new BadRequestException(
          `Chuyến xe chỉ còn ${availableSeats} ghế trống`,
        );
      }
  
      return {
        trip,
        dispatchStatus: BookingDispatchStatus.MANUALLY_ASSIGNED,
        dispatchNote: 'Booking được gán trực tiếp vào chuyến xe do admin chọn.',
      };
    }
  
    /**
     * Trường hợp tạo booking theo tuyến, chiều, ngày, giờ.
     * Hệ thống tự tìm xe phù hợp nhất.
     */
    if (
      !dto.routeLineId ||
      !dto.direction ||
      !dto.travelDate ||
      !dto.preferredTime
    ) {
      throw new BadRequestException(
        'Vui lòng chọn tuyến khai thác, chiều đi, ngày đi và giờ đi',
      );
    }
  
    const departureTime = this.buildVietnamDateTime(
      dto.travelDate,
      dto.preferredTime,
    );
  
    const nextMinute = new Date(departureTime.getTime() + 60 * 1000);
  
    const qb = tripRepository
      .createQueryBuilder('trip')
      .setLock('pessimistic_write')
      .where('trip.route_line_id = :routeLineId', {
        routeLineId: dto.routeLineId,
      })
      .andWhere('trip.direction = :direction', {
        direction: dto.direction,
      })
      .andWhere('trip.departure_time >= :departureTime', {
        departureTime,
      })
      .andWhere('trip.departure_time < :nextMinute', {
        nextMinute,
      })
      .andWhere('trip.status IN (:...statuses)', {
        statuses: [TripStatus.SCHEDULED, TripStatus.OPEN],
      })
      .andWhere('(trip.total_seats - trip.booked_seats) >= :passengerCount', {
        passengerCount,
      });
  
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);
  
      qb.andWhere('trip.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    }
  
    /**
     * Không quyết định xe bằng orderBy này.
     * Chỉ sort ổn định, còn logic chọn xe nằm ở pickBestTripForBooking().
     */
    qb.orderBy('trip.departure_time', 'ASC')
      .addOrderBy('trip.booked_seats', 'DESC')
      .addOrderBy('trip.created_at', 'ASC');
  
    const candidateTrips = await qb.getMany();
  
    if (candidateTrips.length === 0) {
      throw new BadRequestException(
        'Không còn chuyến phù hợp với tuyến, ngày, giờ và số khách đã chọn',
      );
    }
  
    const bookingRepository = manager.getRepository(Booking);
  
    const existingBookings = await bookingRepository.find({
      where: {
        tripId: In(candidateTrips.map((trip) => trip.id)),
        status: In(this.getSeatCountedStatuses()),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  
    const assignment = this.pickBestTripForBooking({
      trips: candidateTrips,
      existingBookings,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
    });
  
    if (!assignment?.trip) {
      throw new BadRequestException(
        'Không tìm được chuyến phù hợp với điểm đón đã chọn',
      );
    }
  
    this.assertCanAccessCompany(currentUser, assignment.trip.companyId);
    this.assertTripCanReceiveBooking(assignment.trip);
  
    const availableSeats =
      Number(assignment.trip.totalSeats) - Number(assignment.trip.bookedSeats);
  
    if (availableSeats < passengerCount) {
      throw new BadRequestException(
        `Chuyến xe chỉ còn ${availableSeats} ghế trống`,
      );
    }
  
    return assignment;
  }

  async findAvailableTimes(
    query: AvailableBookingTimesQueryDto,
    currentUser: CurrentUserData,
  ) {
    const passengerCount = Number(query.passengerCount || 1);
    const { start, end } = this.getVietnamDateRange(query.travelDate);

    const qb = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.driver', 'driver')
      .where('trip.route_line_id = :routeLineId', {
        routeLineId: query.routeLineId,
      })
      .andWhere('trip.direction = :direction', {
        direction: query.direction,
      })
      .andWhere('trip.departure_time >= :start', {
        start,
      })
      .andWhere('trip.departure_time <= :end', {
        end,
      })
      .andWhere('trip.status IN (:...statuses)', {
        statuses: [TripStatus.SCHEDULED, TripStatus.OPEN],
      })
      .andWhere('(trip.total_seats - trip.booked_seats) >= :passengerCount', {
        passengerCount,
      });

    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);

      qb.andWhere('trip.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    }

    qb.orderBy('trip.departure_time', 'ASC');

    const trips = await qb.getMany();

    const grouped = new Map<
      string,
      {
        time: string;
        tripCount: number;
        availableSeats: number;
        vehicles: string[];
        drivers: string[];
      }
    >();

    for (const trip of trips) {
      const time = this.formatTimeInVietnam(trip.departureTime);
      const availableSeats = Math.max(
        0,
        Number(trip.totalSeats || 0) - Number(trip.bookedSeats || 0),
      );

      const current = grouped.get(time) || {
        time,
        tripCount: 0,
        availableSeats: 0,
        vehicles: [],
        drivers: [],
      };

      current.tripCount += 1;
      current.availableSeats += availableSeats;

      if (trip.vehicle?.licensePlate) {
        current.vehicles.push(trip.vehicle.licensePlate);
      }

      if (trip.driver?.fullName) {
        current.drivers.push(trip.driver.fullName);
      }

      grouped.set(time, current);
    }

    return {
      items: Array.from(grouped.values()).map((item) => ({
        ...item,
        label: `${item.time} - còn ${item.availableSeats} ghế`,
        vehicles: [...new Set(item.vehicles)],
        drivers: [...new Set(item.drivers)],
      })),
    };
  }

  private generateBookingCode() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000);

    return `BK-${year}${month}${day}-${random}`;
  }

  private isSeatCountedStatus(status: BookingStatus) {
    return ![BookingStatus.CANCELED, BookingStatus.NO_SHOW].includes(status);
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
        'Bạn không có quyền thao tác booking của nhà xe khác',
      );
    }
  }

  private assertCanAccessBooking(
    currentUser: CurrentUserData,
    booking: Booking,
  ) {
    if (currentUser.role === UserRole.DRIVER) {
      if (booking.trip?.driverId !== currentUser.userId) {
        throw new ForbiddenException('Bạn không có quyền truy cập booking này');
      }

      return;
    }

    this.assertCanAccessCompany(currentUser, booking.companyId);
  }

  private assertTripCanReceiveBooking(trip: Trip) {
    if ([TripStatus.COMPLETED, TripStatus.CANCELED].includes(trip.status)) {
      throw new BadRequestException(
        'Không thể tạo booking cho chuyến đã hoàn thành hoặc đã hủy',
      );
    }
  }

  private calculateTotalAmount(
    passengerCount: number,
    seatPrice: number | null,
  ) {
    if (seatPrice === null) {
      return null;
    }

    return passengerCount * seatPrice;
  }

  private getSeatCountedStatuses() {
    return [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.PICKED_UP,
    ];
  }

  async create(dto: CreateBookingDto, currentUser: CurrentUserData) {
    const savedBookingId = await this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(Trip);
      const bookingRepository = manager.getRepository(Booking);
  
      const passengerCount = dto.passengerCount || 1;
      const status = dto.status || BookingStatus.CONFIRMED;
  
      const assignment = await this.resolveTripForBooking(
        dto,
        currentUser,
        passengerCount,
        manager,
      );
  
      const trip = assignment.trip;
  
      if (this.isSeatCountedStatus(status)) {
        const availableSeats = Number(trip.totalSeats) - Number(trip.bookedSeats);
  
        if (passengerCount > availableSeats) {
          throw new BadRequestException(
            `Chuyến xe chỉ còn ${availableSeats} ghế trống`,
          );
        }
  
        trip.bookedSeats = Number(trip.bookedSeats) + passengerCount;
      }
  
      const seatPrice =
        dto.seatPrice !== undefined && dto.seatPrice !== null
          ? dto.seatPrice
          : trip.basePrice !== null && trip.basePrice !== undefined
            ? Number(trip.basePrice)
            : null;
  
      const totalAmount = this.calculateTotalAmount(passengerCount, seatPrice);
  
      const booking = bookingRepository.create({
        bookingCode: this.generateBookingCode(),
        companyId: trip.companyId,
        tripId: trip.id,
  
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        customerEmail: dto.customerEmail || null,
  
        passengerCount,
  
        pickupAddress: dto.pickupAddress.trim(),
        pickupLat: dto.pickupLat ?? null,
        pickupLng: dto.pickupLng ?? null,
  
        dropoffAddress: dto.dropoffAddress?.trim() || null,
  
        pickupNote: dto.pickupNote || null,
        dropoffNote: dto.dropoffNote || null,
  
        seatPrice: seatPrice !== null ? String(seatPrice) : null,
        totalAmount: totalAmount !== null ? String(totalAmount) : null,
  
        status,
        note: dto.note || null,
  
        dispatchStatus: assignment.dispatchStatus,
        dispatchNote: assignment.dispatchNote,
        assignedByAdminId:
          assignment.dispatchStatus === BookingDispatchStatus.MANUALLY_ASSIGNED
            ? currentUser.userId
            : null,
        assignedAt:
          assignment.dispatchStatus === BookingDispatchStatus.MANUALLY_ASSIGNED
            ? new Date()
            : null,
      });
  
      await tripRepository.save(trip);
  
      const savedBooking = await bookingRepository.save(booking);
  
      return savedBooking.id;
    });
  
    return this.findOne(savedBookingId, currentUser);
  }

  async findAll(query: ListBookingsQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      bookingCode: 'booking.booking_code',
      customerName: 'booking.customer_name',
      customerPhone: 'booking.customer_phone',
      passengerCount: 'booking.passenger_count',
      seatPrice: 'booking.seat_price',
      totalAmount: 'booking.total_amount',
      status: 'booking.status',
      createdAt: 'booking.created_at',
      updatedAt: 'booking.updated_at',
    };

    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.company', 'company')
      .leftJoinAndSelect('booking.trip', 'trip')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.driver', 'driver');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          booking.booking_code ILIKE :keyword
          OR booking.customer_name ILIKE :keyword
          OR booking.customer_phone ILIKE :keyword
          OR route.name ILIKE :keyword
          OR vehicle.license_plate ILIKE :keyword
          OR driver.full_name ILIKE :keyword
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

      qb.andWhere('booking.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (currentUser.role === UserRole.DRIVER) {
      qb.andWhere('trip.driver_id = :driverId', {
        driverId: currentUser.userId,
      });
    } else if (query.companyId) {
      qb.andWhere('booking.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.tripId) {
      qb.andWhere('booking.trip_id = :tripId', {
        tripId: query.tripId,
      });
    }

    if (query.routeId) {
      qb.andWhere('trip.route_id = :routeId', {
        routeId: query.routeId,
      });
    }

    if (query.driverId && currentUser.role !== UserRole.DRIVER) {
      qb.andWhere('trip.driver_id = :driverId', {
        driverId: query.driverId,
      });
    }

    if (query.status) {
      qb.andWhere('booking.status = :status', {
        status: query.status,
      });
    }

    if (query.routeLineId) {
      qb.andWhere('trip.route_line_id = :routeLineId', {
        routeLineId: query.routeLineId,
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
      sortColumnMap[sortBy] || 'booking.created_at',
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
    const booking = await this.bookingRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
        trip: {
          route: true,
          vehicle: true,
          driver: true,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    this.assertCanAccessBooking(currentUser, booking);

    return booking;
  }

  async update(
    id: string,
    dto: UpdateBookingDto,
    currentUser: CurrentUserData,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(Trip);
      const bookingRepository = manager.getRepository(Booking);

      const booking = await bookingRepository.findOne({
        where: {
          id,
        },
        relations: {
          trip: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      this.assertCanAccessCompany(currentUser, booking.companyId);

      const oldTrip = await tripRepository.findOne({
        where: {
          id: booking.tripId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!oldTrip) {
        throw new BadRequestException('Chuyến xe cũ không tồn tại');
      }

      const oldCounted = this.isSeatCountedStatus(booking.status);
      const oldPassengerCount = booking.passengerCount;

      let nextTrip = oldTrip;

      if (dto.tripId && dto.tripId !== booking.tripId) {
        const newTrip = await tripRepository.findOne({
          where: {
            id: dto.tripId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!newTrip) {
          throw new BadRequestException('Chuyến xe mới không tồn tại');
        }

        this.assertCanAccessCompany(currentUser, newTrip.companyId);
        this.assertTripCanReceiveBooking(newTrip);

        nextTrip = newTrip;
      }

      const nextStatus = dto.status || booking.status;
      const nextPassengerCount =
        dto.passengerCount !== undefined
          ? dto.passengerCount
          : booking.passengerCount;

      const nextCounted = this.isSeatCountedStatus(nextStatus);

      if (oldCounted) {
        oldTrip.bookedSeats -= oldPassengerCount;

        if (oldTrip.bookedSeats < 0) {
          oldTrip.bookedSeats = 0;
        }
      }

      if (nextCounted) {
        const availableSeats = nextTrip.totalSeats - nextTrip.bookedSeats;

        if (nextPassengerCount > availableSeats) {
          throw new BadRequestException(
            `Chuyến xe chỉ còn ${availableSeats} ghế trống`,
          );
        }

        nextTrip.bookedSeats += nextPassengerCount;
      }

      const seatPrice =
        dto.seatPrice !== undefined && dto.seatPrice !== null
          ? dto.seatPrice
          : booking.seatPrice !== null
            ? Number(booking.seatPrice)
            : nextTrip.basePrice !== null
              ? Number(nextTrip.basePrice)
              : null;

      const totalAmount = this.calculateTotalAmount(
        nextPassengerCount,
        seatPrice,
      );

      booking.tripId = nextTrip.id;
      booking.companyId = nextTrip.companyId;
      booking.passengerCount = nextPassengerCount;
      booking.status = nextStatus;
      booking.seatPrice = seatPrice !== null ? String(seatPrice) : null;
      booking.totalAmount = totalAmount !== null ? String(totalAmount) : null;

      if (dto.customerName !== undefined) {
        booking.customerName = dto.customerName.trim();
      }

      if (dto.customerPhone !== undefined) {
        booking.customerPhone = dto.customerPhone.trim();
      }

      if (dto.customerEmail !== undefined) {
        booking.customerEmail = dto.customerEmail || null;
      }

      if (dto.pickupAddress !== undefined) {
        booking.pickupAddress = dto.pickupAddress.trim();
      }

      if (dto.pickupLat !== undefined) {
        booking.pickupLat = dto.pickupLat;
      }

      if (dto.pickupLng !== undefined) {
        booking.pickupLng = dto.pickupLng;
      }

      if (dto.dropoffAddress !== undefined) {
        booking.dropoffAddress = dto.dropoffAddress?.trim() || null;
      }

      if (dto.dropoffLat !== undefined) {
        booking.dropoffLat = dto.dropoffLat;
      }

      if (dto.dropoffLng !== undefined) {
        booking.dropoffLng = dto.dropoffLng;
      }

      if (dto.pickupNote !== undefined) {
        booking.pickupNote = dto.pickupNote || null;
      }

      if (dto.dropoffNote !== undefined) {
        booking.dropoffNote = dto.dropoffNote || null;
      }

      if (dto.note !== undefined) {
        booking.note = dto.note || null;
      }

      await tripRepository.save(oldTrip);

      if (nextTrip.id !== oldTrip.id) {
        await tripRepository.save(nextTrip);
      }

      const savedBooking = await bookingRepository.save(booking);

      return this.findOne(savedBooking.id, currentUser);
    });
  }

  async remove(id: string, currentUser: CurrentUserData) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(Trip);
      const bookingRepository = manager.getRepository(Booking);

      const booking = await bookingRepository.findOne({
        where: {
          id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      this.assertCanAccessCompany(currentUser, booking.companyId);

      const trip = await tripRepository.findOne({
        where: {
          id: booking.tripId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!trip) {
        throw new BadRequestException('Chuyến xe không tồn tại');
      }

      if (this.isSeatCountedStatus(booking.status)) {
        trip.bookedSeats -= booking.passengerCount;

        if (trip.bookedSeats < 0) {
          trip.bookedSeats = 0;
        }

        await tripRepository.save(trip);
      }

      await bookingRepository.remove(booking);

      return {
        message: 'Xóa booking thành công',
      };
    });
  }

  async getDispatchBoard(
    query: DispatchBoardQueryDto,
    currentUser: CurrentUserData,
  ) {
    const departureTime = this.buildVietnamDateTime(
      query.travelDate,
      query.preferredTime,
    );
  
    const nextMinute = new Date(departureTime.getTime() + 60 * 1000);
  
    const tripQb = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.route_line_id = :routeLineId', {
        routeLineId: query.routeLineId,
      })
      .andWhere('trip.direction = :direction', {
        direction: query.direction,
      })
      .andWhere('trip.departure_time >= :departureTime', {
        departureTime,
      })
      .andWhere('trip.departure_time < :nextMinute', {
        nextMinute,
      })
      .andWhere('trip.status IN (:...statuses)', {
        statuses: [TripStatus.SCHEDULED, TripStatus.OPEN],
      })
      .orderBy('trip.departure_time', 'ASC')
      .addOrderBy('trip.created_at', 'ASC');
  
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);
  
      tripQb.andWhere('trip.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    }
  
    const trips = await tripQb.getMany();
  
    if (trips.length === 0) {
      return {
        trips: [],
        totalTrips: 0,
        totalSeats: 0,
        bookedSeats: 0,
        availableSeats: 0,
      };
    }
  
    const vehicleIds = trips
      .map((trip) => trip.vehicleId)
      .filter((id): id is string => !!id);
  
    const driverIds = trips
      .map((trip) => trip.driverId)
      .filter((id): id is string => !!id);
  
    const vehicleRepository = this.dataSource.getRepository(Vehicle);
    const userRepository = this.dataSource.getRepository(User);
  
    const vehicles =
      vehicleIds.length > 0
        ? await vehicleRepository.find({
            where: {
              id: In(vehicleIds),
            },
          })
        : [];
  
    const drivers =
      driverIds.length > 0
        ? await userRepository.find({
            where: {
              id: In(driverIds),
            },
          })
        : [];
  
    const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const driverById = new Map(drivers.map((driver) => [driver.id, driver]));
  
    const bookings = await this.bookingRepository.find({
      where: {
        tripId: In(trips.map((trip) => trip.id)),
        status: In(this.getSeatCountedStatuses()),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  
    const bookingsByTripId = new Map<string, Booking[]>();
  
    for (const booking of bookings) {
      const current = bookingsByTripId.get(booking.tripId) || [];
      current.push(booking);
      bookingsByTripId.set(booking.tripId, current);
    }
  
    const tripItems = trips.map((trip) => {
      const tripBookings = bookingsByTripId.get(trip.id) || [];
      const pickupStats = this.getTripPickupStats(tripBookings);
  
      const vehicle = trip.vehicleId ? vehicleById.get(trip.vehicleId) : null;
      const driver = trip.driverId ? driverById.get(trip.driverId) : null;
  
      return {
        tripId: trip.id,
        tripCode: trip.tripCode,
        departureTime: trip.departureTime,
        expectedArrivalTime: trip.expectedArrivalTime,
        direction: trip.direction,
        status: trip.status,
  
        vehicle: vehicle
          ? {
              id: vehicle.id,
              licensePlate: vehicle.licensePlate,
              seatCount: vehicle.seatCount,
            }
          : null,
  
        driver: driver
          ? {
              id: driver.id,
              fullName: driver.fullName,
              phone: driver.phone,
            }
          : null,
  
        totalSeats: Number(trip.totalSeats || 0),
        bookedSeats: Number(trip.bookedSeats || 0),
        availableSeats:
          Number(trip.totalSeats || 0) - Number(trip.bookedSeats || 0),
  
        pickupStats,
  
        bookings: tripBookings.map((booking) => ({
          id: booking.id,
          bookingCode: booking.bookingCode,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          passengerCount: booking.passengerCount,
  
          pickupAddress: booking.pickupAddress,
          pickupLat: booking.pickupLat,
          pickupLng: booking.pickupLng,
  
          dropoffAddress: booking.dropoffAddress,
  
          status: booking.status,
          dispatchStatus: booking.dispatchStatus,
          dispatchNote: booking.dispatchNote,
          createdAt: booking.createdAt,
        })),
      };
    });
  
    return {
      trips: tripItems,
      totalTrips: trips.length,
      totalSeats: trips.reduce(
        (sum, trip) => sum + Number(trip.totalSeats || 0),
        0,
      ),
      bookedSeats: trips.reduce(
        (sum, trip) => sum + Number(trip.bookedSeats || 0),
        0,
      ),
      availableSeats: trips.reduce(
        (sum, trip) =>
          sum + Number(trip.totalSeats || 0) - Number(trip.bookedSeats || 0),
        0,
      ),
    };
  }

  async moveBookingTrip(
    id: string,
    dto: MoveBookingTripDto,
    currentUser: CurrentUserData,
  ) {
    const savedBookingId = await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const tripRepository = manager.getRepository(Trip);
  
      const booking = await bookingRepository.findOne({
        where: {
          id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }
  
      const sourceTrip = await tripRepository.findOne({
        where: {
          id: booking.tripId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
  
      if (!sourceTrip) {
        throw new NotFoundException('Không tìm thấy chuyến hiện tại');
      }
  
      const targetTrip = await tripRepository.findOne({
        where: {
          id: dto.targetTripId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
  
      if (!targetTrip) {
        throw new NotFoundException('Không tìm thấy chuyến cần chuyển');
      }
  
      this.assertCanAccessCompany(currentUser, sourceTrip.companyId);
      this.assertCanAccessCompany(currentUser, targetTrip.companyId);
  
      if (sourceTrip.id === targetTrip.id) {
        return booking.id;
      }
  
      if (sourceTrip.companyId !== targetTrip.companyId) {
        throw new BadRequestException('Không thể chuyển booking sang nhà xe khác');
      }
  
      if (sourceTrip.routeLineId !== targetTrip.routeLineId) {
        throw new BadRequestException('Chỉ được chuyển booking trong cùng tuyến khai thác');
      }
  
      if (sourceTrip.direction !== targetTrip.direction) {
        throw new BadRequestException('Chỉ được chuyển booking trong cùng chiều đi');
      }
  
      if (
        sourceTrip.departureTime.getTime() !== targetTrip.departureTime.getTime()
      ) {
        throw new BadRequestException('Chỉ được chuyển booking trong cùng giờ chạy');
      }
  
      this.assertTripCanReceiveBooking(targetTrip);
  
      if (this.isSeatCountedStatus(booking.status)) {
        const passengerCount = Number(booking.passengerCount || 1);
        const availableSeats =
          Number(targetTrip.totalSeats || 0) - Number(targetTrip.bookedSeats || 0);
  
        if (passengerCount > availableSeats) {
          throw new BadRequestException(
            `Chuyến cần chuyển chỉ còn ${availableSeats} ghế trống`,
          );
        }
  
        sourceTrip.bookedSeats = Math.max(
          0,
          Number(sourceTrip.bookedSeats || 0) - passengerCount,
        );
  
        targetTrip.bookedSeats =
          Number(targetTrip.bookedSeats || 0) + passengerCount;
  
        await tripRepository.save(sourceTrip);
        await tripRepository.save(targetTrip);
      }
  
      booking.tripId = targetTrip.id;
      booking.dispatchStatus = BookingDispatchStatus.MANUALLY_ASSIGNED;
      booking.dispatchNote = dto.note || 'Admin điều phối lại booking sang xe khác';
  
      booking.assignedByAdminId =
        (currentUser as any).userId || (currentUser as any).id || null;
  
      booking.assignedAt = new Date();
  
      const savedBooking = await bookingRepository.save(booking);
  
      return savedBooking.id;
    });
  
    return this.findOne(savedBookingId, currentUser);
  }
}
