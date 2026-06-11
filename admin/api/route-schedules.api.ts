import { cleanParams, http } from './http';
import type { RouteDirection, RouteLineItem } from './route-lines.api';

export type RouteScheduleStatus = 'ACTIVE' | 'INACTIVE';

export type TripStatus =
  | 'SCHEDULED'
  | 'OPEN'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELED';

export type RouteScheduleVehicleItem = {
  id: string;
  companyId: string;
  scheduleId: string;
  vehicleId: string;
  vehicle?: {
    id: string;
    licensePlate: string;
    vehicleType: string;
    seatCount: number;
    companyId: string;
  } | null;
  driverId?: string | null;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
    companyId?: string | null;
  } | null;
  startDirection: RouteDirection;
  firstDepartureTime: string;
  activeFrom: string;
  activeTo?: string | null;
  status: RouteScheduleStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteScheduleTemplateItem = {
  id: string;
  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;
  routeLineId: string;
  routeLine?: RouteLineItem | null;
  name: string;
  startTime: string;
  endTime: string;
  headwayMinutes: number;
  outboundDurationMinutes: number;
  returnDurationMinutes: number;
  turnaroundAtEndMinutes: number;
  turnaroundAtStartMinutes: number;
  daysOfWeek: number[];
  generateDaysAhead: number;
  defaultBasePrice?: string | number | null;
  defaultTripStatus: TripStatus;
  status: RouteScheduleStatus;
  note?: string | null;
  vehicles?: RouteScheduleVehicleItem[];
  createdAt: string;
  updatedAt: string;
};

export type RouteScheduleListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  routeLineId?: string;
  status?: RouteScheduleStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type RouteScheduleListResponse = {
  items: RouteScheduleTemplateItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateRouteSchedulePayload = {
  routeLineId: string;
  name?: string;
  startTime: string;
  endTime: string;
  headwayMinutes: number;
  outboundDurationMinutes: number;
  returnDurationMinutes: number;
  turnaroundAtEndMinutes?: number;
  turnaroundAtStartMinutes?: number;
  daysOfWeek: number[];
  generateDaysAhead?: number;
  defaultBasePrice?: number;
  defaultTripStatus?: TripStatus;
  status?: RouteScheduleStatus;
  note?: string;
};

export type CreateRouteScheduleVehiclePayload = {
  vehicleId: string;
  driverId?: string;
  startDirection: RouteDirection;
  firstDepartureTime: string;
  activeFrom: string;
  activeTo?: string;
  status?: RouteScheduleStatus;
  note?: string;
};

export type GenerateTripsPayload = {
  fromDate?: string;
  toDate?: string;
};

export type GenerateTripsResponse = {
  message: string;
  createdCount: number;
  skippedCount: number;
  skipped?: Array<{
    date: string;
    scheduleVehicleId: string;
    reason: string;
  }>;
};

export async function getRouteSchedulesApi(query: RouteScheduleListQuery) {
  const response = await http.get<RouteScheduleListResponse>(
    '/route-schedules',
    {
      params: cleanParams(query),
    },
  );

  return response.data;
}

export async function getRouteScheduleApi(id: string) {
  const response = await http.get<RouteScheduleTemplateItem>(
    `/route-schedules/${id}`,
  );

  return response.data;
}

export async function createRouteScheduleApi(
  payload: CreateRouteSchedulePayload,
) {
  const response = await http.post<RouteScheduleTemplateItem>(
    '/route-schedules',
    payload,
  );

  return response.data;
}

export async function addVehicleToRouteScheduleApi(
  scheduleId: string,
  payload: CreateRouteScheduleVehiclePayload,
) {
  const response = await http.post<RouteScheduleVehicleItem>(
    `/route-schedules/${scheduleId}/vehicles`,
    payload,
  );

  return response.data;
}

export async function removeVehicleFromRouteScheduleApi(
  scheduleId: string,
  scheduleVehicleId: string,
) {
  const response = await http.delete<{ message: string }>(
    `/route-schedules/${scheduleId}/vehicles/${scheduleVehicleId}`,
  );

  return response.data;
}

export async function generateRouteScheduleTripsApi(
  scheduleId: string,
  payload: GenerateTripsPayload,
) {
  const response = await http.post<GenerateTripsResponse>(
    `/route-schedules/${scheduleId}/generate-trips`,
    payload,
  );

  return response.data;
}

export async function deleteRouteScheduleApi(id: string) {
  const response = await http.delete<{ message: string }>(
    `/route-schedules/${id}`,
  );

  return response.data;
}