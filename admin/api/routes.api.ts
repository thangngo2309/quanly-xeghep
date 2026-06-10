import { cleanParams, http } from './http';

export type TransportRouteStatus = 'ACTIVE' | 'INACTIVE';

export type RouteDriverAssignmentStatus = 'ACTIVE' | 'ENDED';

export type TransportRouteItem = {
  id: string;
  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;
  name: string;
  origin: string;
  destination: string;
  stops?: string[] | null;
  distanceKm?: string | number | null;
  estimatedDurationMinutes?: number | null;
  status: TransportRouteStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteDriverAssignmentItem = {
  id: string;
  companyId: string;
  routeId: string;
  driverId: string;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
  } | null;
  startedAt: string;
  endedAt?: string | null;
  status: RouteDriverAssignmentStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  status?: TransportRouteStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type RouteListResponse = {
  items: TransportRouteItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateRoutePayload = {
  companyId?: string;
  name: string;
  origin: string;
  destination: string;
  stops?: string[];
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  status?: TransportRouteStatus;
  note?: string;
};

export type UpdateRoutePayload = Partial<CreateRoutePayload>;

export type AssignRouteDriverPayload = {
  driverId: string;
  startedAt?: string;
  note?: string;
};

export async function getRoutesApi(query: RouteListQuery) {
  const response = await http.get<RouteListResponse>('/routes', {
    params: cleanParams(query),
  });

  return response.data;
}

export async function createRouteApi(payload: CreateRoutePayload) {
  const response = await http.post<TransportRouteItem>('/routes', payload);

  return response.data;
}

export async function updateRouteApi(
  id: string,
  payload: UpdateRoutePayload,
) {
  const response = await http.patch<TransportRouteItem>(
    `/routes/${id}`,
    payload,
  );

  return response.data;
}

export async function deleteRouteApi(id: string) {
  const response = await http.delete<{ message: string }>(`/routes/${id}`);

  return response.data;
}

export async function assignDriverToRouteApi(
  routeId: string,
  payload: AssignRouteDriverPayload,
) {
  const response = await http.post<RouteDriverAssignmentItem>(
    `/routes/${routeId}/assign-driver`,
    payload,
  );

  return response.data;
}

export async function getRouteDriversApi(routeId: string) {
  const response = await http.get<RouteDriverAssignmentItem[]>(
    `/routes/${routeId}/drivers`,
  );

  return response.data;
}

export async function endRouteDriverAssignmentApi(
  routeId: string,
  assignmentId: string,
) {
  const response = await http.delete<{ message: string }>(
    `/routes/${routeId}/drivers/${assignmentId}`,
  );

  return response.data;
}