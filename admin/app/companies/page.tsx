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
  createCompanyApi,
  deleteCompanyApi,
  getCompaniesApi,
  updateCompanyApi,
  type CompanyItem,
  type CompanyStatus,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from "@/api/companies.api";
import { getApiErrorMessage } from "@/api/http";
import { HDataTable } from "@/components/datatable";
import { useHDialog } from "@/components/dialog";
import { HInput } from "@/components/form";
import {
  CompanyFormDialog,
  type CompanyFormValues,
} from "./components/CompanyFormDialog";
import { AdminLayout } from "../layouts/admin";

type CompanySearchForm = {
  keyword: string;
};

const statusTabs: Array<{
  label: string;
  value: CompanyStatus | "";
}> = [
  {
    label: "Tất cả",
    value: "",
  },
  {
    label: "Hoạt động",
    value: "ACTIVE",
  },
  {
    label: "Ngưng hoạt động",
    value: "INACTIVE",
  },
];

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";

    case "INACTIVE":
      return "Ngưng hoạt động";

    default:
      return status;
  }
}

export default function CompaniesPage() {
  const dialog = useHDialog();

  const searchMethods = useForm<CompanySearchForm>({
    defaultValues: {
      keyword: "",
    },
  });

  const [rows, setRows] = useState<CompanyItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [activeStatus, setActiveStatus] = useState<CompanyStatus | "">("");
  const [searchValues, setSearchValues] = useState<CompanySearchForm>({
    keyword: "",
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
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const sort = sortModel[0];

      const data = await getCompaniesApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || "createdAt",
        sortOrder: (sort?.sort || "desc") as "asc" | "desc",
        keyword: searchValues.keyword || undefined,
        status: activeStatus || undefined,
      });

      setRows(data.items);
      setRowCount(data.total);
    } catch (error) {
      await dialog.error({
        title: "Lỗi tải dữ liệu",
        message: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [
    activeStatus,
    dialog,
    paginationModel.page,
    paginationModel.pageSize,
    searchValues.keyword,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo<GridColDef<CompanyItem>[]>(
    () => [
      {
        field: "code",
        headerName: "Mã nhà xe",
        width: 140,
      },
      {
        field: "name",
        headerName: "Tên nhà xe",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "representativeName",
        headerName: "Người đại diện",
        width: 180,
        renderCell: (params) => params.value || "-",
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
              color={status === "ACTIVE" ? "success" : "warning"}
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

  function handleTabChange(
    _event: React.SyntheticEvent,
    value: CompanyStatus | ""
  ) {
    setActiveStatus(value);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  const handleSearch: SubmitHandler<CompanySearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: CompanySearchForm = {
      keyword: "",
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  function openCreateDialog() {
    setSelectedCompany(null);
    setFormMode("add");
    setFormOpen(true);
  }

  function openEditDialog(company: CompanyItem) {
    setSelectedCompany(company);
    setFormMode("edit");
    setFormOpen(true);
  }

  async function handleDelete(company: CompanyItem) {
    const ok = await dialog.confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa nhà xe "${company.name}" không?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!ok) return;

    try {
      await deleteCompanyApi(company.id);

      await dialog.info({
        title: "Thành công",
        message: "Đã xóa nhà xe thành công.",
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: "Lỗi xóa nhà xe",
        message: getApiErrorMessage(error),
      });
    }
  }

  const handleSubmitCompanyForm: SubmitHandler<CompanyFormValues> = async (
    values
  ) => {
    setFormLoading(true);

    try {
      if (formMode === "add") {
        const payload: CreateCompanyPayload = {
          code: values.code,
          name: values.name,
          phone: values.phone || undefined,
          email: values.email || undefined,
          taxCode: values.taxCode || undefined,
          representativeName: values.representativeName || undefined,
          address: values.address || undefined,
          status: values.status,
          note: values.note || undefined,
        };

        await createCompanyApi(payload);
      } else if (selectedCompany) {
        const payload: UpdateCompanyPayload = {
          code: values.code,
          name: values.name,
          phone: values.phone || undefined,
          email: values.email || undefined,
          taxCode: values.taxCode || undefined,
          representativeName: values.representativeName || undefined,
          address: values.address || undefined,
          status: values.status,
          note: values.note || undefined,
        };

        await updateCompanyApi(selectedCompany.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: "Thành công",
        message:
          formMode === "add"
            ? "Tạo nhà xe thành công."
            : "Cập nhật nhà xe thành công.",
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
            Quản lý nhà xe
          </Typography>

          <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
            Quản lý thông tin nhà xe, mã nhà xe, liên hệ và trạng thái hoạt
            động.
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
            value={activeStatus}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {statusTabs.map((tab) => (
              <Tab
                key={tab.value || "all"}
                value={tab.value}
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        <HDataTable<CompanyItem, CompanySearchForm>
          title="Danh sách nhà xe"
          description="Tìm kiếm và quản lý hồ sơ nhà xe trong hệ thống."
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
          minHeight={240}
          maxHeight={420}
          actions={
            <Button variant="contained" onClick={openCreateDialog}>
              Thêm nhà xe
            </Button>
          }
          searchContent={
            <HInput<CompanySearchForm>
              name="keyword"
              label="Tìm theo tên, mã, SĐT, email"
            />
          }
        />

        <CompanyFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedCompany}
          loading={formLoading}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitCompanyForm}
        />
      </Box>
    </AdminLayout>
  );
}
