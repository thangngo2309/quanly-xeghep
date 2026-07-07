"use client";

import {
  Box,
  Button,
  Chip,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  SubmitHandler,
} from "react-hook-form";
import { useForm } from "react-hook-form";

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
import { AdminLayout } from "../layouts/admin";
import {
  CompanyFormDialog,
  type CompanyFormValues,
} from "./components/CompanyFormDialog";

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

function getStatusLabel(
  status: CompanyStatus,
) {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";

    case "INACTIVE":
      return "Ngưng hoạt động";

    default:
      return status;
  }
}

function getCompanyTypeLabel(
  company: CompanyItem,
) {
  return company.companyType ===
    "OWNER_OPERATOR"
    ? "Chủ xe kinh doanh độc lập"
    : "Nhà xe";
}

export default function CompaniesPage() {
  const dialog = useHDialog();

  const searchMethods =
    useForm<CompanySearchForm>({
      defaultValues: {
        keyword: "",
      },
    });

  const [rows, setRows] = useState<
    CompanyItem[]
  >([]);

  const [rowCount, setRowCount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [
    activeStatus,
    setActiveStatus,
  ] = useState<CompanyStatus | "">("");

  const [
    searchValues,
    setSearchValues,
  ] = useState<CompanySearchForm>({
    keyword: "",
  });

  const [
    paginationModel,
    setPaginationModel,
  ] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [
    sortModel,
    setSortModel,
  ] = useState<GridSortModel>([
    {
      field: "createdAt",
      sort: "desc",
    },
  ]);

  const [formOpen, setFormOpen] =
    useState(false);

  const [formMode, setFormMode] =
    useState<"add" | "edit">("add");

  const [
    selectedCompany,
    setSelectedCompany,
  ] = useState<CompanyItem | null>(null);

  const [
    formLoading,
    setFormLoading,
  ] = useState(false);

  const loadData = useCallback(
    async () => {
      setLoading(true);

      try {
        const sort = sortModel[0];

        const data =
          await getCompaniesApi({
            page:
              paginationModel.page + 1,

            limit:
              paginationModel.pageSize,

            sortBy:
              sort?.field ||
              "createdAt",

            sortOrder: (
              sort?.sort || "desc"
            ) as "asc" | "desc",

            keyword:
              searchValues.keyword ||
              undefined,

            status:
              activeStatus ||
              undefined,
          });

        setRows(data.items);
        setRowCount(data.total);
      } catch (error) {
        await dialog.error({
          title: "Lỗi tải dữ liệu",
          message:
            getApiErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [
      activeStatus,
      dialog,
      paginationModel.page,
      paginationModel.pageSize,
      searchValues.keyword,
      sortModel,
    ],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateDialog =
    useCallback(() => {
      setSelectedCompany(null);
      setFormMode("add");
      setFormOpen(true);
    }, []);

  const openEditDialog =
    useCallback(
      (company: CompanyItem) => {
        setSelectedCompany(company);
        setFormMode("edit");
        setFormOpen(true);
      },
      [],
    );

  const closeFormDialog =
    useCallback(() => {
      if (formLoading) {
        return;
      }

      setFormOpen(false);
      setSelectedCompany(null);
    }, [formLoading]);

  const handleDelete = useCallback(
    async (company: CompanyItem) => {
      const ok = await dialog.confirm({
        title: "Xác nhận xóa",
        message: `Bạn có chắc chắn muốn xóa nhà xe "${company.name}" không?`,
        confirmText: "Xóa",
        cancelText: "Hủy",
      });

      if (!ok) {
        return;
      }

      try {
        await deleteCompanyApi(
          company.id,
        );

        await loadData();

        await dialog.info({
          title: "Thành công",
          message:
            "Đã xóa nhà xe thành công.",
        });
      } catch (error) {
        await dialog.error({
          title: "Lỗi xóa nhà xe",
          message:
            getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData],
  );

  const columns = useMemo<
    GridColDef<CompanyItem>[]
  >(
    () => [
      {
        field: "code",
        headerName: "Mã nhà xe",
        width: 150,
      },
      {
        field: "name",
        headerName: "Tên nhà xe",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "companyType",
        headerName: "Loại đơn vị",
        width: 210,
        renderCell: (params) => (
          <Chip
            size="small"
            label={getCompanyTypeLabel(
              params.row,
            )}
            color={
              params.row.companyType ===
              "OWNER_OPERATOR"
                ? "info"
                : "default"
            }
            variant="outlined"
          />
        ),
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
        renderCell: (params) =>
          params.value || "-",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
        renderCell: (params) =>
          params.value || "-",
      },
      {
        field: "representativeName",
        headerName: "Người đại diện",
        width: 180,
        renderCell: (params) =>
          params.value || "-",
      },
      {
        field: "businessRegistrationNumber",
        headerName: "Số ĐKKD",
        width: 170,
        renderCell: (params) =>
          params.value || "-",
      },
      {
        field: "documents",
        headerName: "Giấy ĐKKD",
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const count =
            params.row
              .businessRegistrationDocuments
              ?.length || 0;

          return (
            <Chip
              size="small"
              label={`${count} file`}
              color={
                count > 0
                  ? "success"
                  : "error"
              }
              variant="outlined"
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Trạng thái",
        width: 160,
        renderCell: (params) => {
          const status =
            params.value as CompanyStatus;

          return (
            <Chip
              size="small"
              label={getStatusLabel(
                status,
              )}
              color={
                status === "ACTIVE"
                  ? "success"
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
          if (!params.value) {
            return "-";
          }

          return new Date(
            String(params.value),
          ).toLocaleString("vi-VN");
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

                openEditDialog(
                  params.row,
                );
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

                void handleDelete(
                  params.row,
                );
              }}
            >
              Xóa
            </Button>
          </Box>
        ),
      },
    ],
    [
      handleDelete,
      openEditDialog,
    ],
  );

  function handleTabChange(
    _event: React.SyntheticEvent,
    value: CompanyStatus | "",
  ) {
    setActiveStatus(value);

    setPaginationModel((previous) => ({
      ...previous,
      page: 0,
    }));
  }

  const handleSearch: SubmitHandler<
    CompanySearchForm
  > = (values) => {
    setSearchValues({
      keyword:
        values.keyword.trim(),
    });

    setPaginationModel((previous) => ({
      ...previous,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: CompanySearchForm =
      {
        keyword: "",
      };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((previous) => ({
      ...previous,
      page: 0,
    }));
  }

  const handleSubmitCompanyForm:
    SubmitHandler<CompanyFormValues> =
    async (values) => {
      setFormLoading(true);

      try {
        if (
          values
            .businessRegistrationDocuments
            .length === 0
        ) {
          throw new Error(
            "Vui lòng tải ít nhất một file giấy đăng ký kinh doanh",
          );
        }

        if (formMode === "add") {
          const payload:
            CreateCompanyPayload = {
            code: values.code
              .trim()
              .toUpperCase(),

            name: values.name.trim(),

            phone:
              values.phone.trim() ||
              undefined,

            email:
              values.email
                .trim()
                .toLowerCase() ||
              undefined,

            taxCode:
              values.taxCode.trim() ||
              undefined,

            representativeName:
              values.representativeName.trim() ||
              undefined,

            address:
              values.address.trim() ||
              undefined,

            status: values.status,

            note:
              values.note.trim() ||
              undefined,

            businessRegistrationNumber:
              values.businessRegistrationNumber.trim(),

            businessRegistrationIssuedDate:
              values.businessRegistrationIssuedDate ||
              undefined,

            businessRegistrationIssuedPlace:
              values.businessRegistrationIssuedPlace.trim(),

            businessRegistrationDocuments:
              values.businessRegistrationDocuments,
          };

          await createCompanyApi(
            payload,
          );
        } else {
          if (!selectedCompany) {
            throw new Error(
              "Không xác định được nhà xe cần cập nhật",
            );
          }

          const payload:
            UpdateCompanyPayload = {
            name: values.name.trim(),

            phone:
              values.phone.trim() ||
              undefined,

            email:
              values.email
                .trim()
                .toLowerCase() ||
              undefined,

            taxCode:
              values.taxCode.trim() ||
              undefined,

            representativeName:
              values.representativeName.trim() ||
              undefined,

            address:
              values.address.trim() ||
              undefined,

            status: values.status,

            note:
              values.note.trim() ||
              undefined,

            /*
             * Các trường trước đây bị thiếu
             * trong payload cập nhật.
             */
            businessRegistrationNumber:
              values.businessRegistrationNumber.trim(),

            businessRegistrationIssuedDate:
              values.businessRegistrationIssuedDate ||
              undefined,

            businessRegistrationIssuedPlace:
              values.businessRegistrationIssuedPlace.trim(),

            businessRegistrationDocuments:
              values.businessRegistrationDocuments,
          };

          if (
            selectedCompany.companyType !==
            "OWNER_OPERATOR"
          ) {
            payload.code = values.code
              .trim()
              .toUpperCase();
          }

          await updateCompanyApi(
            selectedCompany.id,
            payload,
          );
        }

        setFormOpen(false);
        setSelectedCompany(null);

        await loadData();

        await dialog.info({
          title: "Thành công",
          message:
            formMode === "add"
              ? "Tạo nhà xe thành công."
              : "Cập nhật nhà xe và giấy đăng ký kinh doanh thành công.",
        });
      } catch (error) {
        await dialog.error({
          title: "Lỗi lưu dữ liệu",
          message:
            getApiErrorMessage(error),
        });
      } finally {
        setFormLoading(false);
      }
    };

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 900 }}
          >
            Quản lý nhà xe
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 0.75,
            }}
          >
            Quản lý thông tin nhà xe,
            giấy đăng ký kinh doanh,
            liên hệ và trạng thái hoạt động.
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
                key={
                  tab.value || "all"
                }
                value={tab.value}
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        <HDataTable<
          CompanyItem,
          CompanySearchForm
        >
          title="Danh sách nhà xe"
          description="Tìm kiếm và quản lý hồ sơ nhà xe trong hệ thống."
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationModel={
            paginationModel
          }
          onPaginationModelChange={
            setPaginationModel
          }
          sortModel={sortModel}
          onSortModelChange={
            setSortModel
          }
          searchMethods={
            searchMethods
          }
          onSearch={handleSearch}
          onResetSearch={
            handleResetSearch
          }
          onRefresh={loadData}
          minHeight={240}
          maxHeight={420}
          actions={
            <Button
              variant="contained"
              onClick={
                openCreateDialog
              }
            >
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
          initialValues={
            selectedCompany
          }
          loading={formLoading}
          onClose={closeFormDialog}
          onSubmit={
            handleSubmitCompanyForm
          }
        />
      </Box>
    </AdminLayout>
  );
}