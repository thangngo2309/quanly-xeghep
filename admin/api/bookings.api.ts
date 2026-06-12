import { cleanParams, http } from "./http";
import type { RouteDirection } from "./route-lines.api";
import type { TripItem } from "./trips.api";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PICKED_UP"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW";

  export type BookingDispatchStatus =
  | 'AUTO_ASSIGNED'
  | 'WARNING'
  | 'MANUAL_REQUIRED'
  | 'MANUALLY_ASSIGNED';

export type BookingItem = {
  id: string;
  bookingCode: string;

  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;

  tripId: string;
  trip?: TripItem | null;

  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;

  passengerCount: number;

  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  pickupNote?: string | null;
  dropoffNote?: string | null;

  dispatchStatus?: BookingDispatchStatus;
  dispatchNote?: string | null;
  assignedByAdminId?: string | null;
  assignedAt?: string | null;

  seatPrice?: string | number | null;
  totalAmount?: string | number | null;

  status: BookingStatus;
  note?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type BookingListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  tripId?: string;
  routeLineId?: string;
  routeId?: string;
  driverId?: string;
  status?: BookingStatus | "";
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type BookingListResponse = {
  items: BookingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AvailableBookingTimeItem = {
  time: string;
  label: string;
  tripCount: number;
  availableSeats: number;
  vehicles: string[];
  drivers: string[];
};

export type AvailableBookingTimesResponse = {
  items: AvailableBookingTimeItem[];
};

export type AvailableBookingTimesQuery = {
  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  passengerCount?: number;
};

export type CreateBookingPayload = {
  tripId?: string;

  routeLineId?: string;
  direction?: RouteDirection;
  travelDate?: string;
  preferredTime?: string;

  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  passengerCount?: number;

  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupNote?: string;
  dropoffNote?: string;

  seatPrice?: number;
  status?: BookingStatus;
  note?: string;
};

export type DispatchBoardQuery = {
  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  preferredTime: string;
};

export type DispatchBoardBookingItem = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;

  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;

  dropoffAddress?: string | null;

  status: BookingStatus;
  dispatchStatus?: BookingDispatchStatus;
  dispatchNote?: string | null;

  createdAt: string;
};

export type DispatchBoardTripItem = {
  tripId: string;
  tripCode: string;
  departureTime: string;
  expectedArrivalTime?: string | null;
  direction: RouteDirection;
  status: string;

  vehicle?: {
    id: string;
    licensePlate: string;
    seatCount: number;
  } | null;

  driver?: {
    id: string;
    fullName: string;
    phone?: string | null;
  } | null;

  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;

  pickupStats?: {
    centerLat: number | null;
    centerLng: number | null;
    maxDistanceKm: number | null;
  };

  bookings: DispatchBoardBookingItem[];
};

export type DispatchBoardResponse = {
  trips: DispatchBoardTripItem[];
  totalTrips: number;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
};

export type MoveBookingTripPayload = {
  targetTripId: string;
  note?: string;
};

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

export async function getBookingsApi(query: BookingListQuery) {
  const response = await http.get<BookingListResponse>("/bookings", {
    params: cleanParams(query),
  });

  return response.data;
}

export async function getAvailableBookingTimesApi(
  query: AvailableBookingTimesQuery
) {
  const response = await http.get<AvailableBookingTimesResponse>(
    "/bookings/available-times",
    {
      params: cleanParams(query),
    }
  );

  return response.data;
}

export async function createBookingApi(payload: CreateBookingPayload) {
  const response = await http.post<BookingItem>("/bookings", payload);

  return response.data;
}

export async function updateBookingApi(
  id: string,
  payload: UpdateBookingPayload
) {
  const response = await http.patch<BookingItem>(`/bookings/${id}`, payload);

  return response.data;
}

export async function deleteBookingApi(id: string) {
  const response = await http.delete<{ message: string }>(`/bookings/${id}`);

  return response.data;
}

export async function getDispatchBoardApi(query: DispatchBoardQuery) {
  const response = await http.get<DispatchBoardResponse>(
    '/bookings/dispatch-board',
    {
      params: cleanParams(query),
    },
  );

  return response.data;
}

export async function moveBookingTripApi(
  bookingId: string,
  payload: MoveBookingTripPayload,
) {
  const response = await http.patch<BookingItem>(
    `/bookings/${bookingId}/move-trip`,
    payload,
  );

  return response.data;
}
