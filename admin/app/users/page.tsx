"use client";

import { Box, Button, Chip, Tab, Tabs, Typography } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserItem,
  type UserRole,
  type UserStatus,
} from "@/api/users.api";
import { getApiErrorMessage } from "@/api/http";
import { HDataTable } from "@/components/datatable";
import { HInput, HDropdown } from "@/components/form";
import { useHDialog } from "@/components/dialog";
import {
  UserFormDialog,
  type UserFormValues,
} from "./components/UserFormDialog";
import { AdminLayout } from "../layouts/admin";

type UserSearchForm = {
  keyword: string;
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
      status: "",
    },
  });

  const [rows, setRows] = useState<UserItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [activeRole, setActiveRole] = useState<UserRole | "">("");
  const [searchValues, setSearchValues] = useState<UserSearchForm>({
    keyword: "",
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

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const sort = sortModel[0];

      const query: any = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || "createdAt",
        sortOrder: (sort?.sort || "desc") as "asc" | "desc",
        keyword: searchValues.keyword || "",
        role: activeRole,
        status: searchValues.status || "",
      };

      const data = await getUsersApi(query);

      const normalized = normalizeUserResponse(data, query);

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
    dialog,
    paginationModel.page,
    paginationModel.pageSize,
    searchValues.keyword,
    searchValues.status,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
                handleDelete(params.row);
              }}
            >
              Xóa
            </Button>
          </Box>
        ),
      },
    ],
    []
  );

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

      loadData();
    } catch (error) {
      await dialog.error({
        title: "Lỗi xóa người dùng",
        message: getApiErrorMessage(error),
      });
    }
  }

  const handleSubmitUserForm: SubmitHandler<UserFormValues> = async (
    values
  ) => {
    setFormLoading(true);

    try {
      if (formMode === "add") {
        const payload: CreateUserPayload = {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || undefined,
          password: values.password,
          role: values.role,
          status: values.status,
        };

        await createUserApi(payload);
      } else if (selectedUser) {
        const payload: UpdateUserPayload = {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || undefined,
          role: values.role,
          status: values.status,
        };

        if (values.password) {
          payload.password = values.password;
        }

        await updateUserApi(selectedUser.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: "Thành công",
        message:
          formMode === "add"
            ? "Tạo người dùng thành công."
            : "Cập nhật người dùng thành công.",
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: "Lỗi lưu dữ liệu",
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
            {roleTabs.map((tab) => (
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
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitUserForm}
        />
      </Box>
    </AdminLayout>
  );
}
