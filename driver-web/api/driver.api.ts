import axios from 'axios';
import { http, setDriverToken } from './http';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6100/api';

export type DriverLoginPayload = {
  phone: string;
  password: string;
};

export type DriverTripBookingItem = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;

  pickupAddress?: string | null;
  pickupNote?: string | null;

  dropoffAddress?: string | null;
  dropoffNote?: string | null;

  status: string;
  note?: string | null;
};

export type DriverTripItem = {
  tripId: string;
  tripCode: string;

  departureTime: string;
  expectedArrivalTime?: string | null;

  direction: 'OUTBOUND' | 'RETURN';
  status: string;

  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;

  routeLine?: {
    id: string;
    name: string;
  } | null;

  vehicle?: {
    id: string;
    licensePlate: string;
  } | null;

  bookings: DriverTripBookingItem[];
};

export type DriverTripsResponse = {
  items: DriverTripItem[];
};

function extractAccessToken(data: any) {
  return (
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.token ||
    null
  );
}

export async function driverLoginApi(payload: DriverLoginPayload) {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
    identifier: payload.phone,
    password: payload.password,
  });

  const token = extractAccessToken(response.data);

  if (!token) {
    console.log('Login response:', response.data);
    throw new Error('Không nhận được token đăng nhập');
  }

  setDriverToken(token);

  return response.data;
}

export async function getMyDriverTripsApi(params: { date: string }) {
  const response = await http.get<DriverTripsResponse>('/driver/trips', {
    params,
  });

  return response.data;
}