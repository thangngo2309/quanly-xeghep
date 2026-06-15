import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { Trip } from '../trips/entities/trip.entity';
import { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { TripStatus } from 'src/enums/trip.enum';
import { BookingStatus } from 'src/enums/booking.enum';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async getMyTrips(date: string, currentUser: CurrentUserData) {
    if (!date) {
      throw new BadRequestException('Vui lòng truyền ngày cần xem');
    }

    const driverId =
      (currentUser as any)?.userId ||
      (currentUser as any)?.id ||
      (currentUser as any)?.sub ||
      null;

    if (!driverId) {
      throw new UnauthorizedException('Vui lòng đăng nhập tài xế');
    }

    const startOfDay = new Date(`${date}T00:00:00+07:00`);
    const endOfDay = new Date(`${date}T23:59:59+07:00`);
    endOfDay.setSeconds(endOfDay.getSeconds() + 1);

    const rawTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('route_lines', 'routeLine', 'routeLine.id = trip.route_line_id')
      .leftJoin('vehicles', 'vehicle', 'vehicle.id = trip.vehicle_id')
      .where('trip.driver_id = :driverId', {
        driverId,
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
      .select([
        'trip.id AS trip_id',
        'trip.trip_code AS trip_code',
        'trip.departure_time AS departure_time',
        'trip.expected_arrival_time AS expected_arrival_time',
        'trip.direction AS direction',
        'trip.status AS status',
        'trip.total_seats AS total_seats',
        'trip.booked_seats AS booked_seats',
        'routeLine.id AS route_line_id',
        'routeLine.name AS route_line_name',
        'vehicle.id AS vehicle_id',
        'vehicle.license_plate AS license_plate',
      ])
      .orderBy('trip.departure_time', 'ASC')
      .getRawMany();

    if (rawTrips.length === 0) {
      return {
        items: [],
      };
    }

    const tripIds = rawTrips.map((trip) => trip.trip_id);

    const bookings = await this.bookingRepository.find({
      where: {
        tripId: In(tripIds),
        status: In([
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.PICKED_UP,
        ]),
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

    return {
      items: rawTrips.map((trip) => {
        const tripBookings = bookingsByTripId.get(trip.trip_id) || [];

        return {
          tripId: trip.trip_id,
          tripCode: trip.trip_code,

          departureTime: trip.departure_time,
          expectedArrivalTime: trip.expected_arrival_time,

          direction: trip.direction,
          status: trip.status,

          totalSeats: Number(trip.total_seats || 0),
          bookedSeats: Number(trip.booked_seats || 0),
          availableSeats:
            Number(trip.total_seats || 0) - Number(trip.booked_seats || 0),

          routeLine: trip.route_line_id
            ? {
                id: trip.route_line_id,
                name: trip.route_line_name,
              }
            : null,

          vehicle: trip.vehicle_id
            ? {
                id: trip.vehicle_id,
                licensePlate: trip.license_plate,
              }
            : null,

          bookings: tripBookings.map((booking) => ({
            id: booking.id,
            bookingCode: booking.bookingCode,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            passengerCount: booking.passengerCount,

            pickupAddress: booking.pickupAddress,
            pickupNote: booking.pickupNote,

            dropoffAddress: booking.dropoffAddress,
            dropoffNote: booking.dropoffNote,

            status: booking.status,
            note: booking.note,
          })),
        };
      }),
    };
  }
}
