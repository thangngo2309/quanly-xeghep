import { cleanParams, http } from './http';

export type RouteLineStatus = 'ACTIVE' | 'INACTIVE';

export type RouteDirection = 'OUTBOUND' | 'RETURN';

export type TransportRouteInLine = {
  id: string;
  companyId: string;
  routeLineId?: string | null;
  direction?: RouteDirection | null;
  oppositeRouteId?: string | null;
  name: string;
  origin: string;
  destination: string;
  stops?: string[] | null;
  estimatedDurationMinutes?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export type RouteLineItem = {
  id: string;
  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;
  name: string;
  startPoint: string;
  endPoint: string;
  middleStops?: string[] | null;
  defaultDurationMinutes?: number | null;
  defaultTurnaroundMinutes?: number | null;
  status: RouteLineStatus;
  note?: string | null;
  routes?: TransportRouteInLine[];
  createdAt: string;
  updatedAt: string;
};

export type RouteLineListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  status?: RouteLineStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type RouteLineListResponse = {
  items: RouteLineItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateRouteLinePayload = {
  companyId?: string;
  name?: string;
  startPoint: string;
  endPoint: string;
  middleStops?: string[];
  defaultDurationMinutes?: number;
  defaultTurnaroundMinutes?: number;
  createReturnRoute?: boolean;
  status?: RouteLineStatus;
  note?: string;
};

export type UpdateRouteLinePayload = Partial<CreateRouteLinePayload>;

export async function getRouteLinesApi(query: RouteLineListQuery) {
  const response = await http.get<RouteLineListResponse>('/route-lines', {
    params: cleanParams(query),
  });

  return response.data;
}

export async function createRouteLineApi(payload: CreateRouteLinePayload) {
  const response = await http.post<RouteLineItem>('/route-lines', payload);

  return response.data;
}

export async function updateRouteLineApi(
  id: string,
  payload: UpdateRouteLinePayload,
) {
  const response = await http.patch<RouteLineItem>(
    `/route-lines/${id}`,
    payload,
  );

  return response.data;
}

export async function deleteRouteLineApi(id: string) {
  const response = await http.delete<{ message: string }>(
    `/route-lines/${id}`,
  );

  return response.data;
}