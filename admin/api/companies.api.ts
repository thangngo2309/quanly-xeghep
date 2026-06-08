import { http } from './http';

export type CompanyStatus = 'ACTIVE' | 'INACTIVE';

export type CompanyItem = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  representativeName?: string | null;
  address?: string | null;
  status: CompanyStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  status?: CompanyStatus | '';
};

export type CompanyListResponse = {
  items: CompanyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateCompanyPayload = {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  representativeName?: string;
  address?: string;
  status?: CompanyStatus;
  note?: string;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export async function getCompaniesApi(query: CompanyListQuery) {
  const response = await http.get<CompanyListResponse>('/companies', {
    params: query,
  });

  return response.data;
}

export async function createCompanyApi(payload: CreateCompanyPayload) {
  const response = await http.post<CompanyItem>('/companies', payload);

  return response.data;
}

export async function updateCompanyApi(
  id: string,
  payload: UpdateCompanyPayload,
) {
  const response = await http.patch<CompanyItem>(`/companies/${id}`, payload);

  return response.data;
}

export async function deleteCompanyApi(id: string) {
  const response = await http.delete<{ message: string }>(`/companies/${id}`);

  return response.data;
}