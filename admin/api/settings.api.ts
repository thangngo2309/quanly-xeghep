import { cleanParams, http } from './http';

export type SettingStatus = 'ACTIVE' | 'INACTIVE';

export type SettingValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'TEXT';

export type SettingGroup =
  | 'SYSTEM'
  | 'BOOKING'
  | 'TRIP'
  | 'CONTACT'
  | 'PAYMENT'
  | 'OTHER';

export type SettingItem = {
  id: string;
  code: string;
  name: string;
  group: SettingGroup;
  valueType: SettingValueType;
  value?: string | null;
  parsedValue?: unknown;
  description?: string | null;
  status: SettingStatus;
  createdAt: string;
  updatedAt: string;
};

export type SettingListQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  group?: SettingGroup | '';
  valueType?: SettingValueType | '';
  status?: SettingStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type SettingListResponse = {
  items: SettingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateSettingPayload = {
  code: string;
  name: string;
  group?: SettingGroup;
  valueType?: SettingValueType;
  value?: string;
  description?: string;
  status?: SettingStatus;
};

export type UpdateSettingPayload = Partial<CreateSettingPayload>;

export async function getSettingsApi(query: SettingListQuery) {
  const response = await http.get<SettingListResponse>('/settings', {
    params: cleanParams(query),
  });

  return response.data;
}

export async function createSettingApi(payload: CreateSettingPayload) {
  const response = await http.post<SettingItem>('/settings', payload);

  return response.data;
}

export async function updateSettingApi(
  id: string,
  payload: UpdateSettingPayload,
) {
  const response = await http.patch<SettingItem>(`/settings/${id}`, payload);

  return response.data;
}

export async function deleteSettingApi(id: string) {
  const response = await http.delete<{ message: string }>(`/settings/${id}`);

  return response.data;
}