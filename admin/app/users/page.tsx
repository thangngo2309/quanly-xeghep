"use client";

import { Box, Button, Chip, Tab, Tabs, Typography } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { getCompaniesApi } from "@/api/companies.api";
import { getApiErrorMessage } from "@/api/http";
import {
  createOwnerOperatorApi,
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
  type CreateOwnerOperatorPayload,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserItem,
  type UserRole,
  type UserStatus,
} from "@/api/users.api";
import { useHDialog } from "@/components/dialog";
import { HDataTable } from "@/components/datatable";
import { HAutocomplete, HDropdown, HInput } from "@/components/form";
import { getAuthUser } from "@/helper/auth-storage";
import { AdminLayout } from "../layouts/admin";
import {
  UserFormDialog,
  type UserFormValues,
} from "./components/UserFormDialog";

type UserSearchForm = {
  keyword: string;
  companyId: string;
  status: UserStatus | "";
};

const roleTabs: Array<{
  label: string;
  value: UserRole | "";
}> = [
  {
    label: "Tất cả",
    value: "",
  },
  {
    label: "Super Admin",
    value: "SUPER_ADMIN",
  },
  {
    label: "Admin",
    value: "ADMIN",
  },
  {
    label: "Tài xế",
    value: "DRIVER",
  },
];

function getRoleLabel(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";

    case "ADMIN":
      return "Admin";

    case "DRIVER":
      return "Tài xế";

    default:
      return role;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";

    case "INACTIVE":
      return "Không hoạt động";

    case "BLOCKED":
      return "Đã khóa";

    default:
      return status;
  }
}

function normalizeUserResponse(
  data: Awaited<ReturnType<typeof getUsersApi>>,
  fallback: {
    page: number;
    limit: number;
    keyword: string;
    role: UserRole | "";
    companyId?: string;
    status: UserStatus | "";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) {
  if (!Array.isArray(data)) {
    return {
      items: data.items || [],
      total: data.total || 0,
    };
  }

  let items = [...data];

  if (fallback.role) {
    items = items.filter((item) => item.role === fallback.role);
  }

  if (fallback.status) {
    items = items.filter((item) => item.status === fallback.status);
  }

  if (fallback.keyword) {
    const keyword = fallback.keyword.toLowerCase();

    items = items.filter((item) => {
      return (
        item.fullName?.toLowerCase().includes(keyword) ||
        item.phone?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword)
      );
    });
  }

  if (fallback.sortBy) {
    items.sort((a, b) => {
      const aValue = String(a[fallback.sortBy as keyof UserItem] || "");
      const bValue = String(b[fallback.sortBy as keyof UserItem] || "");

      if (fallback.sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      }

      return bValue.localeCompare(aValue);
    });
  }

  if (fallback.companyId) {
    items = items.filter((item) => {
      return (
        item.companyId === fallback.companyId ||
        item.company?.id === fallback.companyId
      );
    });
  }

  const total = items.length;
  const start = (fallback.page - 1) * fallback.limit;
  const end = start + fallback.limit;

  return {
    items: items.slice(start, end),
    total,
  };
}

export default function UsersPage() {
  const dialog = useHDialog();

  const searchMethods = useForm<UserSearchForm>({
    defaultValues: {
      keyword: "",
      companyId: "",
      status: "",
    },
  });

  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [companyOptions, setCompanyOptions] = useState<
    Array<{
      label: string;
      value: string;
    }>
  >([]);

  const [rows, setRows] = useState<UserItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [activeRole, setActiveRole] = useState<UserRole | "">("");
  const [searchValues, setSearchValues] = useState<UserSearchForm>({
    keyword: "",
    companyId: "",
    status: "",
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: "createdAt",
      sort: "desc",
    },
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadCompanyOptions = useCallback(async () => {
    if (currentRole !== "SUPER_ADMIN") {
      setCompanyOptions([]);
      return;
    }

    try {
      const data = await getCompaniesApi({
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "name",
        sortOrder: "asc",
      });

      setCompanyOptions(
        data.items.map((company) => ({
          label: `${company.name} (${company.code})`,
          value: company.id,
        }))
      );
    } catch (error) {
      await dialog.error({
        title: "Lỗi tải nhà xe",
        message: getApiErrorMessage(error),
      });
    }
  }, [currentRole, dialog]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const sort = sortModel[0];

      const query = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || "createdAt",
        sortOrder: (sort?.sort || "desc") as "asc" | "desc",
        keyword: searchValues.keyword || undefined,
        role: currentRole === "ADMIN" ? "DRIVER" : activeRole || undefined,
        companyId:
          currentRole === "SUPER_ADMIN"
            ? searchValues.companyId || undefined
            : undefined,
        status: searchValues.status || undefined,
      };

      const data = await getUsersApi(query);
      const normalized = normalizeUserResponse(data, {
        ...query,
        keyword: searchValues.keyword,
        role: currentRole === "ADMIN" ? "DRIVER" : activeRole,
        status: searchValues.status,
      });

      setRows(normalized.items);
      setRowCount(normalized.total);
    } catch (error) {
      await dialog.error({
        title: "Lỗi tải dữ liệu",
        message: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [
    activeRole,
    currentRole,
    dialog,
    paginationModel.page,
    paginationModel.pageSize,
    searchValues.companyId,
    searchValues.keyword,
    searchValues.status,
    sortModel,
  ]);

  useEffect(() => {
    const user = getAuthUser();
    const role = user?.role as UserRole | undefined;

    if (role) {
      setCurrentRole(role);

      if (role === "ADMIN") {
        setActiveRole("DRIVER");
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCompanyOptions();
  }, [loadCompanyOptions]);

  const visibleRoleTabs = useMemo(() => {
    if (currentRole === "ADMIN") {
      return [
        {
          label: "Tài xế",
          value: "DRIVER" as UserRole,
        },
      ];
    }

    return roleTabs;
  }, [currentRole]);

  function handleTabChange(_event: React.SyntheticEvent, value: UserRole | "") {
    setActiveRole(value);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  const handleSearch: SubmitHandler<UserSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: UserSearchForm = {
      keyword: "",
      companyId: "",
      status: "",
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  function openCreateDialog() {
    setSelectedUser(null);
    setFormMode("add");
    setFormOpen(true);
  }

  function openEditDialog(user: UserItem) {
    setSelectedUser(user);
    setFormMode("edit");
    setFormOpen(true);
  }

  async function handleDelete(user: UserItem) {
    const ok = await dialog.confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}" không?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!ok) return;

    try {
      await deleteUserApi(user.id);

      await dialog.info({
        title: "Thành công",
        message: "Đã xóa người dùng thành công.",
      });

      await loadData();
    } catch (error) {
      await dialog.error({
        title: "Lỗi xóa người dùng",
        message: getApiErrorMessage(error),
      });
    }
  }

  const columns = useMemo<GridColDef<UserItem>[]>(
    () => [
      {
        field: "fullName",
        headerName: "Họ tên",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "role",
        headerName: "Vai trò",
        width: 150,
        renderCell: (params) => (
          <Chip
            size="small"
            label={getRoleLabel(String(params.value))}
            color={params.value === "SUPER_ADMIN" ? "primary" : "default"}
          />
        ),
      },
      {
        field: "company",
        headerName: "Nhà xe/Đơn vị",
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => {
          const company = params.row.company;

          if (!company) return "-";

          return `${company.name} (${company.code})`;
        },
      },
      {
        field: "documents",
        headerName: "Giấy tờ",
        width: 200,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          if (params.row.role !== "DRIVER") return "-";

          const driverLicenseCount =
            params.row.driverLicenseDocuments?.length || 0;
          const businessRegistrationCount =
            params.row.company?.businessRegistrationDocuments?.length || 0;

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexWrap: "wrap",
                height: "100%",
              }}
            >
              <Chip
                size="small"
                label={`GPLX: ${driverLicenseCount}`}
                color={driverLicenseCount > 0 ? "success" : "error"}
                variant="outlined"
              />

              {params.row.company?.companyType === "OWNER_OPERATOR" && (
                <Chip
                  size="small"
                  label={`ĐKKD: ${businessRegistrationCount}`}
                  color={businessRegistrationCount > 0 ? "success" : "error"}
                  variant="outlined"
                />
              )}
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: "Trạng thái",
        width: 160,
        renderCell: (params) => {
          const status = String(params.value);

          return (
            <Chip
              size="small"
              label={getStatusLabel(status)}
              color={
                status === "ACTIVE"
                  ? "success"
                  : status === "BLOCKED"
                  ? "error"
                  : "warning"
              }
            />
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Ngày tạo",
        width: 180,
        renderCell: (params) => {
          if (!params.value) return "-";

          return new Date(String(params.value)).toLocaleString("vi-VN");
        },
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 190,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              height: "100%",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                openEditDialog(params.row);
              }}
            >
              Sửa
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={(event) => {
                event.stopPropagation();
                void handleDelete(params.row);
              }}
            >
              Xóa
            </Button>
          </Box>
        ),
      },
    ],
    [loadData]
  );

  const handleSubmitUserForm: SubmitHandler<UserFormValues> = async (
    values
  ) => {
    setFormLoading(true);

    try {
      if (formMode === "add") {
        const isOwnerOperator =
          values.role === "DRIVER" &&
          values.driverAccountType === "OWNER_OPERATOR";

        if (isOwnerOperator) {
          const payload: CreateOwnerOperatorPayload = {
            fullName: values.fullName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim() || undefined,
            password: values.password,
            status: values.status,
            driverLicenseDocuments: values.driverLicenseDocuments,

            company: {
              code: values.ownerCompanyCode.trim().toUpperCase() || undefined,
              name: values.ownerCompanyName.trim(),
              phone: values.phone.trim(),
              email: values.email.trim() || undefined,
              taxCode: values.ownerTaxCode.trim() || undefined,
              representativeName:
                values.ownerRepresentativeName.trim() || values.fullName.trim(),
              address: values.ownerAddress.trim() || undefined,
              businessRegistrationNumber:
                values.ownerBusinessRegistrationNumber.trim(),
              businessRegistrationIssuedDate:
                values.ownerBusinessRegistrationIssuedDate || undefined,
              businessRegistrationIssuedPlace:
                values.ownerBusinessRegistrationIssuedPlace.trim() || undefined,
              businessRegistrationDocuments:
                values.ownerBusinessRegistrationDocuments,
            },
          };

          await createOwnerOperatorApi(payload);
        } else {
          const payload: CreateUserPayload = {
            fullName: values.fullName.trim(),
            phone: values.phone.trim(),
            email: values.email.trim() || undefined,
            password: values.password,
            role: values.role,
            status: values.status,
            companyId:
              values.role === "SUPER_ADMIN"
                ? undefined
                : values.companyId || undefined,
            driverLicenseDocuments:
              values.role === "DRIVER"
                ? values.driverLicenseDocuments
                : undefined,
          };

          await createUserApi(payload);
        }
      } else {
        if (!selectedUser) {
          throw new Error("Không xác định được người dùng cần cập nhật");
        }

        const selectedCompanyId =
          selectedUser.companyId || selectedUser.company?.id || null;

        const isOwnerOperator =
          selectedUser.role === "DRIVER" &&
          selectedUser.company?.companyType === "OWNER_OPERATOR" &&
          selectedUser.company.ownerUserId === selectedUser.id;

        const payload: UpdateUserPayload = {
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || undefined,
          password: values.password || undefined,
          role: values.role,
          status: values.status,

          companyId:
            values.role === "SUPER_ADMIN"
              ? null
              : isOwnerOperator
              ? selectedCompanyId
              : values.companyId || selectedCompanyId,

          driverLicenseDocuments:
            values.role === "DRIVER"
              ? values.driverLicenseDocuments
              : undefined,

          ownerCompany: isOwnerOperator
            ? {
                name: values.ownerCompanyName.trim(),

                phone: values.phone.trim(),

                email: values.email.trim() || undefined,

                taxCode: values.ownerTaxCode.trim() || undefined,

                representativeName:
                  values.ownerRepresentativeName.trim() ||
                  values.fullName.trim(),

                address: values.ownerAddress.trim() || undefined,

                businessRegistrationNumber:
                  values.ownerBusinessRegistrationNumber.trim() || undefined,

                businessRegistrationIssuedDate:
                  values.ownerBusinessRegistrationIssuedDate || undefined,

                businessRegistrationIssuedPlace:
                  values.ownerBusinessRegistrationIssuedPlace.trim() ||
                  undefined,

                businessRegistrationDocuments:
                  values.ownerBusinessRegistrationDocuments,
              }
            : undefined,
        };

        await updateUserApi(selectedUser.id, payload);
      }

      setFormOpen(false);
      setSelectedUser(null);

      await loadData();

      await dialog.info({
        title:
          formMode === "add"
            ? "Tạo người dùng thành công"
            : "Cập nhật người dùng thành công",
        message:
          formMode === "add" &&
          values.role === "DRIVER" &&
          values.driverAccountType === "OWNER_OPERATOR"
            ? "Đã tạo tài xế, đơn vị kinh doanh và lưu giấy tờ."
            : formMode === "add"
            ? "Tài khoản và giấy tờ đã được tạo."
            : "Thông tin tài khoản và giấy tờ đã được cập nhật.",
      });
    } catch (error) {
      await dialog.error({
        title:
          formMode === "add"
            ? "Không thể tạo người dùng"
            : "Không thể cập nhật người dùng",
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Quản lý người dùng
          </Typography>

          <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
            Quản lý tài khoản Super Admin, Admin nhà xe và tài xế.
          </Typography>
        </Box>

        <Box
          sx={{
            mb: 2,
            bgcolor: "#fff",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            px: 2,
          }}
        >
          <Tabs
            value={activeRole}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {visibleRoleTabs.map((tab) => (
              <Tab
                key={tab.value || "all"}
                value={tab.value}
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        <HDataTable<UserItem, UserSearchForm>
          title="Danh sách người dùng"
          description="Tìm kiếm, phân loại và quản lý tài khoản trong hệ thống."
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          searchMethods={searchMethods}
          onSearch={handleSearch}
          onResetSearch={handleResetSearch}
          onRefresh={loadData}
          minHeight={260}
          maxHeight={460}
          actions={
            <Button variant="contained" onClick={openCreateDialog}>
              Thêm người dùng
            </Button>
          }
          searchContent={
            <>
              <HInput<UserSearchForm>
                name="keyword"
                label="Tìm theo tên, SĐT, email"
              />

              {currentRole === "SUPER_ADMIN" && (
                <HAutocomplete<UserSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              <HDropdown<UserSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    label: "Hoạt động",
                    value: "ACTIVE",
                  },
                  {
                    label: "Không hoạt động",
                    value: "INACTIVE",
                  },
                  {
                    label: "Đã khóa",
                    value: "BLOCKED",
                  },
                ]}
              />
            </>
          }
        />

        <UserFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedUser}
          loading={formLoading}
          onClose={() => {
            setFormOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmitUserForm}
          currentRole={currentRole}
          companyOptions={companyOptions}
        />
      </Box>
    </AdminLayout>
  );
}
