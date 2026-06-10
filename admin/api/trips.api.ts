import { cleanParams, http } from './http';

export type TripStatus =
  | 'SCHEDULED'
  | 'OPEN'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELED';

export type TripItem = {
  id: string;
  tripCode: string;

  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;

  routeId: string;
  route?: {
    id: string;
    name: string;
    origin: string;
    destination: string;
  } | null;

  vehicleId: string;
  vehicle?: {
    id: string;
    licensePlate: string;
    vehicleType: string;
    seatCount: number;
  } | null;

  driverId: string;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;

  departureTime: string;
  expectedArrivalTime?: string | null;

  totalSeats: number;
  bookedSeats: number;

  basePrice?: string | number | null;

  status: TripStatus;

  pickupNote?: string | null;
  dropoffNote?: string | null;
  note?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type TripListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  status?: TripStatus | '';
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type TripListResponse = {
  items: TripItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateTripPayload = {
  routeId: string;
  vehicleId: string;
  driverId?: string;
  departureTime: string;
  expectedArrivalTime?: string;
  totalSeats?: number;
  basePrice?: number;
  status?: TripStatus;
  pickupNote?: string;
  dropoffNote?: string;
  note?: string;
};

export type UpdateTripPayload = Partial<CreateTripPayload>;

export async function getTripsApi(query: TripListQuery) {
  const response = await http.get<TripListResponse>('/trips', {
    params: cleanParams(query),
  });

  return response.data;
}

export async function createTripApi(payload: CreateTripPayload) {
  const response = await http.post<TripItem>('/trips', payload);

  return response.data;
}

export async function updateTripApi(id: string, payload: UpdateTripPayload) {
  const response = await http.patch<TripItem>(`/trips/${id}`, payload);

  return response.data;
}

export async function deleteTripApi(id: string) {
  const response = await http.delete<{ message: string }>(`/trips/${id}`);

  return response.data;
}