import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { DataSource, In, Repository } from 'typeorm';
  
  import { Booking } from '../bookings/entities/booking.entity';
  import { RouteLine } from '../route-lines/entities/route-line.entity';
  import { Trip } from '../trips/entities/trip.entity';
  import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
  import { PublicAvailableTimesQueryDto } from './dto/public-available-times-query.dto';
import { BookingDispatchStatus, BookingStatus } from 'src/enums/booking.enum';
import { TripStatus } from 'src/enums/trip.enum';
  
  type PickTripResult = {
    trip: Trip;
    dispatchStatus: BookingDispatchStatus;
    dispatchNote: string | null;
  };
  
  @Injectable()
  export class PublicService {
    private readonly PICKUP_NEAR_RADIUS_KM = 5;
    private readonly PICKUP_WARNING_RADIUS_KM = 10;
    private readonly PICKUP_HARD_LIMIT_KM = 15;
  
    constructor(
      private readonly dataSource: DataSource,
  
      @InjectRepository(RouteLine)
      private readonly routeLineRepository: Repository<RouteLine>,
  
      @InjectRepository(Trip)
      private readonly tripRepository: Repository<Trip>,
  
      @InjectRepository(Booking)
      private readonly bookingRepository: Repository<Booking>,
    ) {}
  
    async getRouteLines(companyId: string) {
      const items = await this.routeLineRepository.find({
        where: {
          companyId,
        },
        order: {
          name: 'ASC',
        },
      });
  
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        startPoint: (item as any).startPoint ?? null,
        endPoint: (item as any).endPoint ?? null,
      }));
    }
  
    async getAvailableTimes(query: PublicAvailableTimesQueryDto) {
      const passengerCount = query.passengerCount || 1;
  
      const startOfDay = this.buildVietnamDateTime(query.travelDate, '00:00');
      const endOfDay = this.buildVietnamDateTime(query.travelDate, '23:59');
      endOfDay.setMinutes(endOfDay.getMinutes() + 1);
  
      const trips = await this.tripRepository
        .createQueryBuilder('trip')
        .leftJoin('vehicles', 'vehicle', 'vehicle.id = trip.vehicle_id')
        .leftJoin('users', 'driver', 'driver.id = trip.driver_id')
        .where('trip.route_line_id = :routeLineId', {
          routeLineId: query.routeLineId,
        })
        .andWhere('trip.direction = :direction', {
          direction: query.direction,
        })
        .andWhere('trip.departure_time >= :startOfDay', {
          startOfDay,
        })
        .andWhere('trip.departure_time < :endOfDay', {
          endOfDay,
        })
        .andWhere('trip.status IN (:...statuses)', {
          statuses: [TripStatus.SCHEDULED, TripStatus.OPEN],
        })
        .andWhere('(trip.total_seats - trip.booked_seats) >= :passengerCount', {
          passengerCount,
        })
        .select([
          'trip.id AS id',
          'trip.departure_time AS departure_time',
          'trip.total_seats AS total_seats',
          'trip.booked_seats AS booked_seats',
          'vehicle.license_plate AS license_plate',
          'driver.full_name AS driver_name',
        ])
        .orderBy('trip.departure_time', 'ASC')
        .getRawMany();
  
      const grouped = new Map<
        string,
        {
          time: string;
          label: string;
          tripCount: number;
          availableSeats: number;
          vehicles: string[];
          drivers: string[];
        }
      >();
  
      for (const trip of trips) {
        const departureTime = new Date(trip.departure_time);
        const time = this.formatVietnamTime(departureTime);
        const availableSeats =
          Number(trip.total_seats || 0) - Number(trip.booked_seats || 0);
  
        const current =
          grouped.get(time) ||
          {
            time,
            label: '',
            tripCount: 0,
            availableSeats: 0,
            vehicles: [],
            drivers: [],
          };
  
        current.tripCount += 1;
        current.availableSeats += availableSeats;
  
        if (trip.license_plate && !current.vehicles.includes(trip.license_plate)) {
          current.vehicles.push(trip.license_plate);
        }
  
        if (trip.driver_name && !current.drivers.includes(trip.driver_name)) {
          current.drivers.push(trip.driver_name);
        }
  
        current.label = `${time} - còn ${current.availableSeats} ghế`;
  
        grouped.set(time, current);
      }
  
      return {
        items: Array.from(grouped.values()),
      };
    }
  
    async createBooking(dto: CreatePublicBookingDto) {
      const savedBookingId = await this.dataSource.transaction(async (manager) => {
        const routeLineRepository = manager.getRepository(RouteLine);
        const tripRepository = manager.getRepository(Trip);
        const bookingRepository = manager.getRepository(Booking);
  
        const routeLine = await routeLineRepository.findOne({
          where: {
            id: dto.routeLineId,
            companyId: dto.companyId,
          },
        });
  
        if (!routeLine) {
          throw new BadRequestException('Tuyến đi không hợp lệ');
        }
  
        const passengerCount = dto.passengerCount || 1;
  
        const departureTime = this.buildVietnamDateTime(
          dto.travelDate,
          dto.preferredTime,
        );
  
        const nextMinute = new Date(departureTime.getTime() + 60 * 1000);
  
        const candidateTrips = await tripRepository
          .createQueryBuilder('trip')
          .setLock('pessimistic_write')
          .where('trip.company_id = :companyId', {
            companyId: dto.companyId,
          })
          .andWhere('trip.route_line_id = :routeLineId', {
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
          })
          .orderBy('trip.booked_seats', 'DESC')
          .addOrderBy('trip.created_at', 'ASC')
          .getMany();
  
        if (candidateTrips.length === 0) {
          throw new BadRequestException(
            'Không còn chuyến phù hợp với tuyến, ngày, giờ và số khách đã chọn',
          );
        }
  
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
  
        const trip = assignment.trip;
  
        const availableSeats =
          Number(trip.totalSeats || 0) - Number(trip.bookedSeats || 0);
  
        if (passengerCount > availableSeats) {
          throw new BadRequestException(
            `Chuyến xe chỉ còn ${availableSeats} ghế trống`,
          );
        }
  
        trip.bookedSeats = Number(trip.bookedSeats || 0) + passengerCount;
  
        const seatPrice =
          trip.basePrice !== null && trip.basePrice !== undefined
            ? Number(trip.basePrice)
            : null;
  
        const totalAmount =
          seatPrice !== null ? passengerCount * seatPrice : null;
  
        const booking = bookingRepository.create({
          bookingCode: this.generateBookingCode(),
          companyId: trip.companyId,
          tripId: trip.id,
  
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          customerEmail: dto.customerEmail?.trim() || null,
  
          passengerCount,
  
          pickupAddress: dto.pickupAddress.trim(),
          pickupLat: dto.pickupLat ?? null,
          pickupLng: dto.pickupLng ?? null,
  
          dropoffAddress: dto.dropoffAddress?.trim() || null,
  
          pickupNote: dto.pickupNote?.trim() || null,
          dropoffNote: dto.dropoffNote?.trim() || null,
  
          seatPrice: seatPrice !== null ? String(seatPrice) : null,
          totalAmount: totalAmount !== null ? String(totalAmount) : null,
  
          status: BookingStatus.CONFIRMED,
          note: dto.note?.trim() || null,
  
          dispatchStatus: assignment.dispatchStatus,
          dispatchNote: assignment.dispatchNote,
          assignedByAdminId: null,
          assignedAt: null,
        });
  
        await tripRepository.save(trip);
  
        const savedBooking = await bookingRepository.save(booking);
  
        return savedBooking.id;
      });
  
      const booking = await this.bookingRepository.findOne({
        where: {
          id: savedBookingId,
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking vừa tạo');
      }
  
      return {
        id: booking.id,
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        passengerCount: booking.passengerCount,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        status: booking.status,
        dispatchStatus: booking.dispatchStatus,
        dispatchNote: booking.dispatchNote,
      };
    }
  
    private getSeatCountedStatuses() {
      return [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.PICKED_UP,
      ];
    }
  
    private pickBestTripForBooking(params: {
      trips: Trip[];
      existingBookings: Booking[];
      pickupLat?: number;
      pickupLng?: number;
    }): PickTripResult {
      const { trips, existingBookings, pickupLat, pickupLng } = params;
  
      const bookingsByTripId = new Map<string, Booking[]>();
  
      for (const booking of existingBookings) {
        const current = bookingsByTripId.get(booking.tripId) || [];
        current.push(booking);
        bookingsByTripId.set(booking.tripId, current);
      }
  
      if (
        pickupLat === undefined ||
        pickupLng === undefined ||
        pickupLat === null ||
        pickupLng === null
      ) {
        const trip = [...trips].sort((a, b) => {
          if (Number(a.bookedSeats) !== Number(b.bookedSeats)) {
            return Number(b.bookedSeats) - Number(a.bookedSeats);
          }
  
          return a.createdAt.getTime() - b.createdAt.getTime();
        })[0];
  
        return {
          trip,
          dispatchStatus: BookingDispatchStatus.WARNING,
          dispatchNote:
            'Booking chưa có tọa độ điểm đón, hệ thống đã tự ghép vào xe phù hợp.',
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
                    Number(pickupLat),
                    Number(pickupLng),
                    Number(booking.pickupLat),
                    Number(booking.pickupLng),
                  ),
                ),
              )
            : null;
  
        return {
          trip,
          bookings,
          hasCustomer: bookings.length > 0 || Number(trip.bookedSeats) > 0,
          nearestPickupDistanceKm,
          bookedSeats: Number(trip.bookedSeats || 0),
          availableSeats: Number(trip.totalSeats || 0) - Number(trip.bookedSeats || 0),
        };
      });
  
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
          ).toFixed(1)}km. Hệ thống vẫn ghép vào xe này, admin có thể điều phối lại nếu cần.`,
        };
      }
  
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
  
    private buildVietnamDateTime(date: string, time: string) {
      return new Date(`${date}T${time}:00+07:00`);
    }
  
    private formatVietnamTime(date: Date) {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(date);
    }
  
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
  
    private generateBookingCode() {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-8);
      const random = Math.floor(1000 + Math.random() * 9000);
  
      return `BK${timestamp}${random}`;
    }
  }