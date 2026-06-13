import { cleanParams, http } from './http';

export type RouteDirection = 'OUTBOUND' | 'RETURN';

export type PublicRouteLineItem = {
  id: string;
  name: string;
  startPoint?: string | null;
  endPoint?: string | null;
};

export type PublicAvailableTimeItem = {
  time: string;
  label: string;
  tripCount: number;
  availableSeats: number;
  vehicles?: string[];
  drivers?: string[];
};

export type PublicAvailableTimesResponse = {
  items: PublicAvailableTimeItem[];
};

export type PublicCreateBookingPayload = {
  companyId: string;

  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  preferredTime: string;

  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  passengerCount: number;

  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;

  dropoffAddress?: string;
  pickupNote?: string;
  dropoffNote?: string;
  note?: string;
};

export type PublicBookingResponse = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  status: string;
  dispatchStatus?: string;
  dispatchNote?: string | null;
};

export async function getPublicRouteLinesApi(companyId: string) {
  const response = await http.get<PublicRouteLineItem[]>(
    '/public/route-lines',
    {
      params: {
        companyId,
      },
    },
  );

  return response.data;
}

export async function getPublicAvailableTimesApi(params: {
  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  passengerCount?: number;
}) {
  const response = await http.get<PublicAvailableTimesResponse>(
    '/public/bookings/available-times',
    {
      params: cleanParams(params),
    },
  );

  return response.data;
}

export async function createPublicBookingApi(
  payload: PublicCreateBookingPayload,
) {
  const response = await http.post<PublicBookingResponse>(
    '/public/bookings',
    payload,
  );

  return response.data;
}