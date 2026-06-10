import { cleanParams, http } from './http';

export type VehicleType = 'FIVE_SEAT' | 'SEVEN_SEAT' | 'LIMOUSINE_10';

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export type VehicleItem = {
  id: string;
  companyId: string;
  company?: {
    id: string;
    code: string;
    name: string;
  };
  licensePlate: string;
  vehicleType: VehicleType;
  seatCount: number;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  productionYear?: number | null;
  registrationExpiryDate?: string | null;
  status: VehicleStatus;
  note?: string | null;
  assignmentOnDate?: {
    id: string;
    date: string;
    driverId: string;
    driver?: {
      id: string;
      fullName: string;
      phone: string;
    };
    note?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  companyId?: string;
  vehicleType?: VehicleType | '';
  status?: VehicleStatus | '';
  assignmentDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type VehicleListResponse = {
  items: VehicleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateVehiclePayload = {
  companyId?: string;
  licensePlate: string;
  vehicleType: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  productionYear?: number;
  registrationExpiryDate?: string;
  status?: VehicleStatus;
  note?: string;
};

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export type AssignDriverPayload = {
  driverId: string;
  date: string;
  note?: string;
};

export async function getVehiclesApi(query: VehicleListQuery) {
  const response = await http.get<VehicleListResponse>('/vehicles', {
    params: cleanParams(query),
  });

  return response.data;
}

export async function createVehicleApi(payload: CreateVehiclePayload) {
  const response = await http.post<VehicleItem>('/vehicles', payload);

  return response.data;
}

export async function updateVehicleApi(
  id: string,
  payload: UpdateVehiclePayload,
) {
  const response = await http.patch<VehicleItem>(`/vehicles/${id}`, payload);

  return response.data;
}

export async function deleteVehicleApi(id: string) {
  const response = await http.delete<{ message: string }>(`/vehicles/${id}`);

  return response.data;
}

export async function assignDriverToVehicleApi(
  vehicleId: string,
  payload: AssignDriverPayload,
) {
  const response = await http.post(
    `/vehicles/${vehicleId}/assign-driver`,
    payload,
  );

  return response.data;
}

export async function getVehicleAssignmentsApi(vehicleId: string) {
  const response = await http.get(`/vehicles/${vehicleId}/assignments`);

  return response.data;
}

export async function deleteVehicleAssignmentApi(
  vehicleId: string,
  assignmentId: string,
) {
  const response = await http.delete(
    `/vehicles/${vehicleId}/assignments/${assignmentId}`,
  );

  return response.data;
}