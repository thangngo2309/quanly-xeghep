"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { getCompaniesApi } from "@/api/companies.api";
import { getApiErrorMessage } from "@/api/http";
import { getUsersApi, type UserRole } from "@/api/users.api";
import {
  assignDriverToVehicleApi,
  createVehicleApi,
  deleteVehicleApi,
  getVehiclesApi,
  updateVehicleApi,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
  type VehicleItem,
  type VehicleStatus,
  type VehicleType,
} from "@/api/vehicles.api";
import { HDataTable } from "@/components/datatable";
import { useHDialog } from "@/components/dialog";
import { HDatePicker, HDropdown, HInput } from "@/components/form";

import {
  AssignDriverDialog,
  type AssignDriverFormValues,
  type DriverOption,
} from "./components/AssignDriverDialog";
import {
  VehicleFormDialog,
  type CompanyOption,
  type VehicleFormValues,
} from "./components/VehicleFormDialog";
import { getAuthUser } from "@/helper/auth-storage";
import { AdminLayout } from "../layouts/admin";

type VehicleSearchForm = {
  keyword: string;
  companyId: string;
  vehicleType: VehicleType | "";
  status: VehicleStatus | "";
  assignmentDate: string;
};

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getVehicleTypeLabel(type: VehicleType | string) {
  switch (type) {
    case "FIVE_SEAT":
      return "Xe 5 chỗ";

    case "SEVEN_SEAT":
      return "Xe 7 chỗ";

    case "LIMOUSINE_10":
      return "Limousine 10 chỗ";

    default:
      return type;
  }
}

function getVehicleStatusLabel(status: VehicleStatus | string) {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";

    case "MAINTENANCE":
      return "Bảo trì";

    case "INACTIVE":
      return "Ngưng hoạt động";

    default:
      return status;
  }
}

function getVehicleStatusColor(status: VehicleStatus | string) {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "MAINTENANCE":
      return "warning";

    case "INACTIVE":
      return "default";

    default:
      return "default";
  }
}

export default function VehiclesPage() {
  const dialog = useHDialog();

  const today = useMemo(() => getTodayDateString(), []);

  const searchMethods = useForm<VehicleSearchForm>({
    defaultValues: {
      keyword: "",
      companyId: "",
      vehicleType: "",
      status: "",
      assignmentDate: today,
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<VehicleItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);

  const [searchValues, setSearchValues] = useState<VehicleSearchForm>({
    keyword: "",
    companyId: "",
    vehicleType: "",
    status: "",
    assignmentDate: today,
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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    const role = user?.role as UserRole | undefined;

    if (role) {
      setCurrentRole(role);
    }

    setAuthReady(true);
  }, []);

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

  useEffect(() => {
    loadCompanyOptions();
  }, [loadCompanyOptions]);

  const loadData = useCallback(async () => {
    if (!authReady) return;

    setLoading(true);

    try {
      const sort = sortModel[0];

      const data = await getVehiclesApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || "createdAt",
        sortOrder: (sort?.sort || "desc") as "asc" | "desc",
        keyword: searchValues.keyword || undefined,
        companyId:
          currentRole === "SUPER_ADMIN"
            ? searchValues.companyId || undefined
            : undefined,
        vehicleType: searchValues.vehicleType || undefined,
        status: searchValues.status || undefined,
        assignmentDate: searchValues.assignmentDate || undefined,
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
    authReady,
    currentRole,
    dialog,
    paginationModel.page,
    paginationModel.pageSize,
    searchValues.assignmentDate,
    searchValues.companyId,
    searchValues.keyword,
    searchValues.status,
    searchValues.vehicleType,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDriverOptions = useCallback(
    async (vehicle: VehicleItem) => {
      try {
        const data = await getUsersApi({
          page: 1,
          limit: 100,
          role: "DRIVER",
          status: "ACTIVE",
          companyId:
            currentRole === "SUPER_ADMIN" ? vehicle.companyId : undefined,
          sortBy: "fullName",
          sortOrder: "asc",
        });

        setDriverOptions(
          data.items.map((driver) => ({
            label: `${driver.fullName} - ${driver.phone}`,
            value: driver.id,
          }))
        );
      } catch (error) {
        setDriverOptions([]);

        await dialog.error({
          title: "Lỗi tải tài xế",
          message: getApiErrorMessage(error),
        });
      }
    },
    [currentRole, dialog]
  );

  const handleSearch: SubmitHandler<VehicleSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: VehicleSearchForm = {
      keyword: "",
      companyId: "",
      vehicleType: "",
      status: "",
      assignmentDate: today,
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  const openCreateDialog = useCallback(() => {
    setSelectedVehicle(null);
    setFormMode("add");
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((vehicle: VehicleItem) => {
    setSelectedVehicle(vehicle);
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  const openAssignDialog = useCallback((vehicle: VehicleItem) => {
    setSelectedVehicle(vehicle);
    setDriverOptions([]);
    setAssignOpen(true);
  }, []);

  useEffect(() => {
    if (!assignOpen || !selectedVehicle) return;

    loadDriverOptions(selectedVehicle);
  }, [assignOpen, selectedVehicle, loadDriverOptions]);

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel((prev) => {
        if (prev.page === model.page && prev.pageSize === model.pageSize) {
          return prev;
        }

        return model;
      });
    },
    []
  );

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel((prev) => {
      const prevItem = prev[0];
      const nextItem = model[0];

      if (
        prevItem?.field === nextItem?.field &&
        prevItem?.sort === nextItem?.sort
      ) {
        return prev;
      }

      return model;
    });
  }, []);

  const handleDelete = useCallback(
    async (vehicle: VehicleItem) => {
      const ok = await dialog.confirm({
        title: "Xác nhận xóa",
        message: `Bạn có chắc chắn muốn xóa xe "${vehicle.licensePlate}" không?`,
        confirmText: "Xóa",
        cancelText: "Hủy",
      });

      if (!ok) return;

      try {
        await deleteVehicleApi(vehicle.id);

        await dialog.info({
          title: "Thành công",
          message: "Đã xóa xe thành công.",
        });

        loadData();
      } catch (error) {
        await dialog.error({
          title: "Lỗi xóa xe",
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData]
  );

  const handleSubmitVehicleForm: SubmitHandler<VehicleFormValues> = async (
    values
  ) => {
    setFormLoading(true);

    try {
      const basePayload: CreateVehiclePayload | UpdateVehiclePayload = {
        companyId: currentRole === "SUPER_ADMIN" ? values.companyId : undefined,
        licensePlate: values.licensePlate,
        vehicleType: values.vehicleType,
        brand: values.brand || undefined,
        model: values.model || undefined,
        color: values.color || undefined,
        productionYear: values.productionYear
          ? Number(values.productionYear)
          : undefined,
        registrationExpiryDate: values.registrationExpiryDate || undefined,
        status: values.status,
        note: values.note || undefined,
      };

      if (formMode === "add") {
        await createVehicleApi(basePayload as CreateVehiclePayload);
      } else if (selectedVehicle) {
        await updateVehicleApi(selectedVehicle.id, basePayload);
      }

      setFormOpen(false);

      await dialog.info({
        title: "Thành công",
        message:
          formMode === "add" ? "Tạo xe thành công." : "Cập nhật xe thành công.",
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

  const handleSubmitAssignForm: SubmitHandler<AssignDriverFormValues> = async (
    values
  ) => {
    if (!selectedVehicle) return;

    setAssignLoading(true);

    try {
      await assignDriverToVehicleApi(selectedVehicle.id, {
        driverId: values.driverId,
        date: values.date,
        note: values.note || undefined,
      });

      setAssignOpen(false);

      await dialog.info({
        title: "Thành công",
        message: "Đã phân tài xế cho xe thành công.",
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: "Lỗi phân tài xế",
        message: getApiErrorMessage(error),
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const columns = useMemo<GridColDef<VehicleItem>[]>(() => {
    const baseColumns: GridColDef<VehicleItem>[] = [
      {
        field: "licensePlate",
        headerName: "Biển số",
        width: 140,
      },
    ];

    if (currentRole === "SUPER_ADMIN") {
      baseColumns.push({
        field: "company",
        headerName: "Nhà xe",
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => {
          const company = params.row.company;

          if (!company) return "-";

          return `${company.name} (${company.code})`;
        },
      });
    }

    baseColumns.push(
      {
        field: "vehicleType",
        headerName: "Loại xe",
        width: 170,
        renderCell: (params) => getVehicleTypeLabel(String(params.value)),
      },
      {
        field: "seatCount",
        headerName: "Số chỗ",
        width: 100,
      },
      {
        field: "brand",
        headerName: "Hãng xe",
        width: 130,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "model",
        headerName: "Dòng xe",
        width: 130,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "assignmentOnDate",
        headerName: "Tài xế trong ngày",
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => {
          const assignment = params.row.assignmentOnDate;

          if (!assignment?.driver) return "-";

          return `${assignment.driver.fullName} - ${assignment.driver.phone}`;
        },
      },
      {
        field: "status",
        headerName: "Trạng thái",
        width: 150,
        renderCell: (params) => {
          const status = String(params.value);

          return (
            <Chip
              size="small"
              label={getVehicleStatusLabel(status)}
              color={getVehicleStatusColor(status) as any}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 245,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          return (
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
                onClick={(event) => {
                  event.stopPropagation();
                  openAssignDialog(params.row);
                }}
              >
                Phân
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
          );
        },
      }
    );

    return baseColumns;
  }, [currentRole, handleDelete, openAssignDialog, openEditDialog]);

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Quản lý xe
          </Typography>

          <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
            Quản lý danh sách xe, loại xe và phân tài xế lái xe theo ngày.
          </Typography>
        </Box>

        <HDataTable<VehicleItem, VehicleSearchForm>
          title="Danh sách xe"
          description="Tìm kiếm, thêm mới, cập nhật và phân tài xế cho xe."
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationModel={paginationModel}
          sortModel={sortModel}
          searchMethods={searchMethods}
          onSearch={handleSearch}
          onResetSearch={handleResetSearch}
          onRefresh={loadData}
          onPaginationModelChange={handlePaginationModelChange}
          onSortModelChange={handleSortModelChange}
          minHeight={260}
          maxHeight={460}
          actions={
            <Button
              variant="contained"
              onClick={(event) => {
                event.stopPropagation();
                openCreateDialog();
              }}
            >
              Thêm xe
            </Button>
          }
          searchContent={
            <>
              <HInput<VehicleSearchForm>
                name="keyword"
                label="Tìm biển số, hãng xe, dòng xe"
              />

              {currentRole === "SUPER_ADMIN" && (
                <HDropdown<VehicleSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              <HDropdown<VehicleSearchForm>
                name="vehicleType"
                label="Loại xe"
                placeholder="Tất cả loại xe"
                options={[
                  {
                    label: "Xe 5 chỗ",
                    value: "FIVE_SEAT",
                  },
                  {
                    label: "Xe 7 chỗ",
                    value: "SEVEN_SEAT",
                  },
                  {
                    label: "Limousine 10 chỗ",
                    value: "LIMOUSINE_10",
                  },
                ]}
              />

              <HDropdown<VehicleSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    label: "Hoạt động",
                    value: "ACTIVE",
                  },
                  {
                    label: "Bảo trì",
                    value: "MAINTENANCE",
                  },
                  {
                    label: "Ngưng hoạt động",
                    value: "INACTIVE",
                  },
                ]}
              />

              <HDatePicker<VehicleSearchForm>
                name="assignmentDate"
                label="Ngày xem tài xế"
              />
            </>
          }
        />

        <VehicleFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedVehicle}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitVehicleForm}
        />

        <AssignDriverDialog
          open={assignOpen}
          vehicle={selectedVehicle}
          loading={assignLoading}
          initialDate={searchValues.assignmentDate || today}
          driverOptions={driverOptions}
          onClose={() => setAssignOpen(false)}
          onSubmit={handleSubmitAssignForm}
        />
      </Box>
    </AdminLayout>
  );
}
