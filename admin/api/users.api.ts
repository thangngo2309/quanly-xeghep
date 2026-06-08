import { http } from './http';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type UserItem = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
};

export type UserListResponse = {
  items: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateUserPayload = {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
};

export type UpdateUserPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
};

export async function getUsersApi(query: UserListQuery) {
  const response = await http.get<UserListResponse | UserItem[]>('/users', {
    params: query,
  });

  return response.data;
}

export async function createUserApi(payload: CreateUserPayload) {
  const response = await http.post<UserItem>('/users', payload);

  return response.data;
}

export async function updateUserApi(id: string, payload: UpdateUserPayload) {
  const response = await http.patch<UserItem>(`/users/${id}`, payload);

  return response.data;
}

export async function deleteUserApi(id: string) {
  const response = await http.delete<{ message: string }>(`/users/${id}`);

  return response.data;
}