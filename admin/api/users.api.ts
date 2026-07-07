import { http } from "./http";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "DRIVER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type CompanyType = "TRANSPORT_COMPANY" | "OWNER_OPERATOR";

export type UpdateOwnerOperatorCompanyPayload = {
  name?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  representativeName?: string;
  address?: string;

  businessRegistrationNumber?: string;
  businessRegistrationIssuedDate?: string;
  businessRegistrationIssuedPlace?: string;
  businessRegistrationDocuments?: string[];
};

export type UserCompanyItem = {
  id: string;
  code: string;
  name: string;

  companyType?: CompanyType;
  ownerUserId?: string | null;

  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  representativeName?: string | null;
  address?: string | null;

  businessRegistrationNumber?: string | null;
  businessRegistrationIssuedDate?: string | null;
  businessRegistrationIssuedPlace?: string | null;
  businessRegistrationDocuments?: string[];

  status?: string;
  note?: string | null;
};

export type UserItem = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;

  role: UserRole;
  status: UserStatus;

  companyId?: string | null;
  company?: UserCompanyItem | null;

  /**
   * Danh sách đường dẫn ảnh hoặc PDF bằng lái xe.
   */
  driverLicenseDocuments?: string[];

  createdAt: string;
  updatedAt: string;
};

export type UserListQuery = {
  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";

  keyword?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
  companyId?: string;
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

  /**
   * ADMIN và DRIVER thuộc nhà xe bắt buộc có companyId.
   * SUPER_ADMIN không gửi companyId.
   */
  companyId?: string;

  /**
   * Bắt buộc khi role là DRIVER.
   */
  driverLicenseDocuments?: string[];
};

export type UpdateUserPayload = {
  fullName?: string;
  phone?: string;
  email?: string;

  password?: string;
  role?: UserRole;
  status?: UserStatus;

  companyId?: string | null;

  driverLicenseDocuments?: string[];

  /**
   * Backend chỉ chấp nhận khi user là chủ của
   * company OWNER_OPERATOR.
   */
  ownerCompany?: UpdateOwnerOperatorCompanyPayload;
};

export type CreateOwnerOperatorCompanyPayload = {
  code?: string;
  name: string;

  phone?: string;
  email?: string;

  taxCode?: string;
  representativeName?: string;
  address?: string;

  businessRegistrationNumber: string;
  businessRegistrationIssuedDate?: string;
  businessRegistrationIssuedPlace?: string;

  /**
   * Bắt buộc phải có ít nhất một ảnh hoặc PDF
   * giấy đăng ký kinh doanh.
   */
  businessRegistrationDocuments: string[];

  note?: string;
};

export type CreateOwnerOperatorPayload = {
  fullName: string;
  phone: string;
  email?: string;

  password: string;
  status?: UserStatus;

  /**
   * Bắt buộc phải có ít nhất một ảnh hoặc PDF bằng lái.
   */
  driverLicenseDocuments: string[];

  company: CreateOwnerOperatorCompanyPayload;
};

export type CreateOwnerOperatorResponse = {
  user: UserItem;

  company: {
    id: string;
    code: string;
    name: string;

    companyType: CompanyType;
    ownerUserId: string | null;

    phone?: string | null;
    email?: string | null;
    taxCode?: string | null;
    representativeName?: string | null;
    address?: string | null;

    businessRegistrationNumber?: string | null;
    businessRegistrationIssuedDate?: string | null;
    businessRegistrationIssuedPlace?: string | null;
    businessRegistrationDocuments?: string[];

    note?: string | null;
  };
};

export async function getUsersApi(query: UserListQuery) {
  const response = await http.get<UserListResponse>("/users", {
    params: query,
  });

  return response.data;
}

export async function createUserApi(payload: CreateUserPayload) {
  const response = await http.post<UserItem>("/users", payload);

  return response.data;
}

export async function createOwnerOperatorApi(
  payload: CreateOwnerOperatorPayload,
) {
  const response = await http.post<CreateOwnerOperatorResponse>(
    "/users/owner-operator",
    payload,
  );

  return response.data;
}

export async function updateUserApi(
  id: string,
  payload: UpdateUserPayload,
) {
  const response = await http.patch<UserItem>(
    `/users/${id}`,
    payload,
  );

  return response.data;
}

export async function deleteUserApi(id: string) {
  const response = await http.delete<{
    message: string;
  }>(`/users/${id}`);

  return response.data;
}