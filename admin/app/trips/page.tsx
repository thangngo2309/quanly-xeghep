'use client';

import { Box, Button, Chip, Typography } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { getCompaniesApi } from '@/api/companies.api';
import { getApiErrorMessage } from '@/api/http';
import {
  createTripApi,
  deleteTripApi,
  getTripsApi,
  updateTripApi,
  type CreateTripPayload,
  type TripItem,
  type TripStatus,
  type UpdateTripPayload,
} from '@/api/trips.api';
import { getRoutesApi } from '@/api/routes.api';
import { getUsersApi, type UserRole } from '@/api/users.api';
import { getVehiclesApi } from '@/api/vehicles.api';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';
import { getAuthUser } from '@/helper/auth-storage';
import { AdminLayout } from '../layouts/admin';

import {
  TripFormDialog,
  type SelectOption,
  type TripFormValues,
} from './components/TripFormDialog';

type TripSearchForm = {
  keyword: string;
  companyId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus | '';
  fromDate: string;
  toDate: string;
};

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toApiDateTime(value?: string) {
  if (!value) return undefined;

  if (value.includes('+') || value.endsWith('Z')) {
    return value;
  }

  if (value.length === 16) {
    return `${value}:00+07:00`;
  }

  return value;
}

function getTripStatusLabel(status: TripStatus | string) {
  switch (status) {
    case 'SCHEDULED':
      return 'Đã lên lịch';

    case 'OPEN':
      return 'Mở nhận khách';

    case 'RUNNING':
      return 'Đang chạy';

    case 'COMPLETED':
      return 'Hoàn thành';

    case 'CANCELED':
      return 'Đã hủy';

    default:
      return status;
  }
}

function getTripStatusColor(status: TripStatus | string) {
  switch (status) {
    case 'SCHEDULED':
      return 'info';

    case 'OPEN':
      return 'success';

    case 'RUNNING':
      return 'warning';

    case 'COMPLETED':
      return 'default';

    case 'CANCELED':
      return 'error';

    default:
      return 'default';
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return '-';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numberValue);
}

export default function TripsPage() {
  const dialog = useHDialog();

  const today = useMemo(() => getTodayDateString(), []);

  const searchMethods = useForm<TripSearchForm>({
    defaultValues: {
      keyword: '',
      companyId: '',
      routeId: '',
      vehicleId: '',
      driverId: '',
      status: '',
      fromDate: today,
      toDate: today,
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<TripItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [routeOptions, setRouteOptions] = useState<SelectOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);

  const [searchValues, setSearchValues] = useState<TripSearchForm>({
    keyword: '',
    companyId: '',
    routeId: '',
    vehicleId: '',
    driverId: '',
    status: '',
    fromDate: today,
    toDate: today,
  });

  const [paginationModel, setPaginationModel] =
    useState<GridPaginationModel>({
      page: 0,
      pageSize: 10,
    });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: 'departureTime',
      sort: 'desc',
    },
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedTrip, setSelectedTrip] = useState<TripItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    const role = user?.role as UserRole | undefined;

    if (role) {
      setCurrentRole(role);
    }

    setAuthReady(true);
  }, []);

  const loadCompanyOptions = useCallback(async () => {
    if (currentRole !== 'SUPER_ADMIN') {
      setCompanyOptions([]);
      return;
    }

    try {
      const data = await getCompaniesApi({
        page: 1,
        limit: 100,
        status: 'ACTIVE',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setCompanyOptions(
        data.items.map((company) => ({
          label: `${company.name} (${company.code})`,
          value: company.id,
          companyId: company.id,
        })),
      );
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải nhà xe',
        message: getApiErrorMessage(error),
      });
    }
  }, [currentRole, dialog]);

  const loadSelectOptions = useCallback(async () => {
    if (!authReady || !currentRole || currentRole === 'DRIVER') return;

    try {
      const [routesData, vehiclesData, driversData] = await Promise.all([
        getRoutesApi({
          page: 1,
          limit: 100,
          status: 'ACTIVE',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
        getVehiclesApi({
          page: 1,
          limit: 100,
          status: 'ACTIVE',
          sortBy: 'licensePlate',
          sortOrder: 'asc',
        }),
        getUsersApi({
          page: 1,
          limit: 100,
          role: 'DRIVER',
          status: 'ACTIVE',
          sortBy: 'fullName',
          sortOrder: 'asc',
        }),
      ]);

      setRouteOptions(
        routesData.items.map((route) => ({
          label:
            currentRole === 'SUPER_ADMIN' && route.company
              ? `${route.name} - ${route.company.name}`
              : route.name,
          value: route.id,
          companyId: route.companyId,
        })),
      );

      setVehicleOptions(
        vehiclesData.items.map((vehicle) => ({
          label:
            currentRole === 'SUPER_ADMIN' && vehicle.company
              ? `${vehicle.licensePlate} - ${vehicle.company.name}`
              : vehicle.licensePlate,
          value: vehicle.id,
          companyId: vehicle.companyId,
        })),
      );

      setDriverOptions(
        driversData.items.map((driver) => ({
          label: `${driver.fullName} - ${driver.phone}`,
          value: driver.id,
          companyId: driver.company?.id || undefined,
        })),
      );
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải dữ liệu chọn',
        message: getApiErrorMessage(error),
      });
    }
  }, [authReady, currentRole, dialog]);

  useEffect(() => {
    loadCompanyOptions();
  }, [loadCompanyOptions]);

  useEffect(() => {
    loadSelectOptions();
  }, [loadSelectOptions]);

  const loadData = useCallback(async () => {
    if (!authReady) return;

    setLoading(true);

    try {
      const sort = sortModel[0];

      const data = await getTripsApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || 'departureTime',
        sortOrder: (sort?.sort || 'desc') as 'asc' | 'desc',
        keyword: searchValues.keyword || undefined,
        companyId:
          currentRole === 'SUPER_ADMIN'
            ? searchValues.companyId || undefined
            : undefined,
        routeId: searchValues.routeId || undefined,
        vehicleId: searchValues.vehicleId || undefined,
        driverId:
          currentRole !== 'DRIVER'
            ? searchValues.driverId || undefined
            : undefined,
        status: searchValues.status || undefined,
        fromDate: searchValues.fromDate || undefined,
        toDate: searchValues.toDate || undefined,
      });

      setRows(data.items);
      setRowCount(data.total);
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải chuyến xe',
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
    searchValues.companyId,
    searchValues.driverId,
    searchValues.fromDate,
    searchValues.keyword,
    searchValues.routeId,
    searchValues.status,
    searchValues.toDate,
    searchValues.vehicleId,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel((prev) => {
        if (prev.page === model.page && prev.pageSize === model.pageSize) {
          return prev;
        }

        return model;
      });
    },
    [],
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

  const handleSearch: SubmitHandler<TripSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: TripSearchForm = {
      keyword: '',
      companyId: '',
      routeId: '',
      vehicleId: '',
      driverId: '',
      status: '',
      fromDate: today,
      toDate: today,
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  const openCreateDialog = useCallback(() => {
    setSelectedTrip(null);
    setFormMode('add');
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((trip: TripItem) => {
    setSelectedTrip(trip);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (trip: TripItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa chuyến "${trip.tripCode}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteTripApi(trip.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa chuyến xe thành công.',
        });

        loadData();
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa chuyến',
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData],
  );

  const handleSubmitTripForm: SubmitHandler<TripFormValues> = async (
    values,
  ) => {
    setFormLoading(true);

    try {
      const payload: CreateTripPayload | UpdateTripPayload = {
        routeId: values.routeId,
        vehicleId: values.vehicleId,
        driverId: values.driverId || undefined,
        departureTime: toApiDateTime(values.departureTime) || '',
        expectedArrivalTime: toApiDateTime(values.expectedArrivalTime),
        totalSeats: values.totalSeats ? Number(values.totalSeats) : undefined,
        basePrice: values.basePrice ? Number(values.basePrice) : undefined,
        status: values.status,
        pickupNote: values.pickupNote || undefined,
        dropoffNote: values.dropoffNote || undefined,
        note: values.note || undefined,
      };

      if (formMode === 'add') {
        await createTripApi(payload as CreateTripPayload);
      } else if (selectedTrip) {
        await updateTripApi(selectedTrip.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message:
          formMode === 'add'
            ? 'Tạo chuyến xe thành công.'
            : 'Cập nhật chuyến xe thành công.',
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi lưu chuyến xe',
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = useMemo<GridColDef<TripItem>[]>(() => {
    const baseColumns: GridColDef<TripItem>[] = [
      {
        field: 'tripCode',
        headerName: 'Mã chuyến',
        width: 170,
      },
    ];

    if (currentRole === 'SUPER_ADMIN') {
      baseColumns.push({
        field: 'company',
        headerName: 'Nhà xe',
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => {
          const company = params.row.company;

          if (!company) return '-';

          return `${company.name} (${company.code})`;
        },
      });
    }

    baseColumns.push(
      {
        field: 'route',
        headerName: 'Tuyến',
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => params.row.route?.name || '-',
      },
      {
        field: 'departureTime',
        headerName: 'Khởi hành',
        width: 180,
        renderCell: (params) => formatDateTime(String(params.value)),
      },
      {
        field: 'vehicle',
        headerName: 'Xe',
        width: 140,
        sortable: false,
        renderCell: (params) => params.row.vehicle?.licensePlate || '-',
      },
      {
        field: 'driver',
        headerName: 'Tài xế',
        flex: 1,
        minWidth: 190,
        sortable: false,
        renderCell: (params) => {
          const driver = params.row.driver;

          if (!driver) return '-';

          return `${driver.fullName} - ${driver.phone}`;
        },
      },
      {
        field: 'seats',
        headerName: 'Ghế',
        width: 100,
        sortable: false,
        renderCell: (params) =>
          `${params.row.bookedSeats || 0}/${params.row.totalSeats || 0}`,
      },
      {
        field: 'basePrice',
        headerName: 'Giá vé',
        width: 140,
        renderCell: (params) => formatCurrency(params.value as any),
      },
      {
        field: 'status',
        headerName: 'Trạng thái',
        width: 150,
        renderCell: (params) => {
          const status = String(params.value);

          return (
            <Chip
              size="small"
              label={getTripStatusLabel(status)}
              color={getTripStatusColor(status) as any}
            />
          );
        },
      },
    );

    if (currentRole !== 'DRIVER') {
      baseColumns.push({
        field: 'actions',
        headerName: 'Thao tác',
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              height: '100%',
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
      });
    }

    return baseColumns;
  }, [currentRole, handleDelete, openEditDialog]);

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Quản lý chuyến xe
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Quản lý lịch chuyến, tuyến đường, xe, tài xế và trạng thái chuyến.
          </Typography>
        </Box>

        <HDataTable<TripItem, TripSearchForm>
          title="Danh sách chuyến xe"
          description="Tạo chuyến, cập nhật chuyến và theo dõi trạng thái vận hành."
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          searchMethods={searchMethods}
          onSearch={handleSearch}
          onResetSearch={handleResetSearch}
          onRefresh={loadData}
          minHeight={260}
          maxHeight={460}
          actions={
            currentRole !== 'DRIVER' ? (
              <Button
                variant="contained"
                onClick={(event) => {
                  event.stopPropagation();
                  openCreateDialog();
                }}
              >
                Thêm chuyến
              </Button>
            ) : null
          }
          searchContent={
            <>
              <HInput<TripSearchForm>
                name="keyword"
                label="Tìm mã chuyến, tuyến, xe, tài xế"
              />

              {currentRole === 'SUPER_ADMIN' && (
                <HDropdown<TripSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              {currentRole !== 'DRIVER' && (
                <>
                  <HDropdown<TripSearchForm>
                    name="routeId"
                    label="Tuyến đường"
                    placeholder="Tất cả tuyến"
                    options={routeOptions}
                  />

                  <HDropdown<TripSearchForm>
                    name="vehicleId"
                    label="Xe"
                    placeholder="Tất cả xe"
                    options={vehicleOptions}
                  />

                  <HDropdown<TripSearchForm>
                    name="driverId"
                    label="Tài xế"
                    placeholder="Tất cả tài xế"
                    options={driverOptions}
                  />
                </>
              )}

              <HDropdown<TripSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    label: 'Đã lên lịch',
                    value: 'SCHEDULED',
                  },
                  {
                    label: 'Mở nhận khách',
                    value: 'OPEN',
                  },
                  {
                    label: 'Đang chạy',
                    value: 'RUNNING',
                  },
                  {
                    label: 'Hoàn thành',
                    value: 'COMPLETED',
                  },
                  {
                    label: 'Đã hủy',
                    value: 'CANCELED',
                  },
                ]}
              />

              <HDatePicker<TripSearchForm>
                name="fromDate"
                label="Từ ngày"
              />

              <HDatePicker<TripSearchForm>
                name="toDate"
                label="Đến ngày"
              />
            </>
          }
        />

        <TripFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedTrip}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          routeOptions={routeOptions}
          vehicleOptions={vehicleOptions}
          driverOptions={driverOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitTripForm}
        />
      </Box>
    </AdminLayout>
  );
}