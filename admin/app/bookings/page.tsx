'use client';

import { Box, Button, Chip, Typography } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import {
  createBookingApi,
  deleteBookingApi,
  getBookingsApi,
  updateBookingApi,
  type BookingItem,
  type BookingStatus,
  type CreateBookingPayload,
  type UpdateBookingPayload,
} from '@/api/bookings.api';
import { getCompaniesApi } from '@/api/companies.api';
import { getApiErrorMessage } from '@/api/http';
import { getRoutesApi } from '@/api/routes.api';
import { getTripsApi, type TripStatus } from '@/api/trips.api';
import { getUsersApi, type UserRole } from '@/api/users.api';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';
import { getAuthUser } from '@/helper/auth-storage';
import { AdminLayout } from '../layouts/admin';

import {
  BookingFormDialog,
  type BookingFormValues,
  type SelectOption,
} from './components/BookingFormDialog';

type BookingSearchForm = {
  keyword: string;
  companyId: string;
  tripId: string;
  routeId: string;
  driverId: string;
  status: BookingStatus | '';
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

function getBookingStatusLabel(status: BookingStatus | string) {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận';

    case 'CONFIRMED':
      return 'Đã xác nhận';

    case 'PICKED_UP':
      return 'Đã đón khách';

    case 'COMPLETED':
      return 'Hoàn thành';

    case 'CANCELED':
      return 'Đã hủy';

    case 'NO_SHOW':
      return 'Khách không đi';

    default:
      return status;
  }
}

function getBookingStatusColor(status: BookingStatus | string) {
  switch (status) {
    case 'PENDING':
      return 'warning';

    case 'CONFIRMED':
      return 'info';

    case 'PICKED_UP':
      return 'success';

    case 'COMPLETED':
      return 'default';

    case 'CANCELED':
      return 'error';

    case 'NO_SHOW':
      return 'error';

    default:
      return 'default';
  }
}

export default function BookingsPage() {
  const dialog = useHDialog();

  const today = useMemo(() => getTodayDateString(), []);

  const searchMethods = useForm<BookingSearchForm>({
    defaultValues: {
      keyword: '',
      companyId: '',
      tripId: '',
      routeId: '',
      driverId: '',
      status: '',
      fromDate: today,
      toDate: today,
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<BookingItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [tripOptions, setTripOptions] = useState<SelectOption[]>([]);
  const [routeOptions, setRouteOptions] = useState<SelectOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);

  const [searchValues, setSearchValues] = useState<BookingSearchForm>({
    keyword: '',
    companyId: '',
    tripId: '',
    routeId: '',
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
      field: 'createdAt',
      sort: 'desc',
    },
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );
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
    if (!authReady || !currentRole) return;

    try {
      const [tripsData, routesData, driversData] = await Promise.all([
        getTripsApi({
          page: 1,
          limit: 100,
          sortBy: 'departureTime',
          sortOrder: 'desc',
        }),
        getRoutesApi({
          page: 1,
          limit: 100,
          status: 'ACTIVE',
          sortBy: 'name',
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

      setTripOptions(
        tripsData.items.map((trip) => {
          const routeName = trip.route?.name || 'Chưa có tuyến';
          const vehiclePlate = trip.vehicle?.licensePlate || 'Chưa có xe';
          const departure = formatDateTime(trip.departureTime);
          const companyName = trip.company?.name;

          return {
            label:
              currentRole === 'SUPER_ADMIN' && companyName
                ? `${routeName} - ${departure} - ${vehiclePlate} - ${companyName}`
                : `${routeName} - ${departure} - ${vehiclePlate}`,
            value: trip.id,
            companyId: trip.companyId,
            routeId: trip.routeId,
            driverId: trip.driverId,
          };
        }),
      );

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

      const data = await getBookingsApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: (sort?.sort || 'desc') as 'asc' | 'desc',
        keyword: searchValues.keyword || undefined,
        companyId:
          currentRole === 'SUPER_ADMIN'
            ? searchValues.companyId || undefined
            : undefined,
        tripId: searchValues.tripId || undefined,
        routeId: searchValues.routeId || undefined,
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
        title: 'Lỗi tải booking',
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
    searchValues.tripId,
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

  const handleSearch: SubmitHandler<BookingSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: BookingSearchForm = {
      keyword: '',
      companyId: '',
      tripId: '',
      routeId: '',
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
    setSelectedBooking(null);
    setFormMode('add');
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((booking: BookingItem) => {
    setSelectedBooking(booking);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (booking: BookingItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa booking "${booking.bookingCode}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteBookingApi(booking.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa booking thành công.',
        });

        loadData();
        loadSelectOptions();
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa booking',
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData, loadSelectOptions],
  );

  const handleSubmitBookingForm: SubmitHandler<BookingFormValues> = async (
    values,
  ) => {
    setFormLoading(true);

    try {
      const payload: CreateBookingPayload | UpdateBookingPayload = {
        tripId: values.tripId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        passengerCount: values.passengerCount
          ? Number(values.passengerCount)
          : undefined,
        pickupAddress: values.pickupAddress || undefined,
        dropoffAddress: values.dropoffAddress || undefined,
        pickupNote: values.pickupNote || undefined,
        dropoffNote: values.dropoffNote || undefined,
        seatPrice: values.seatPrice ? Number(values.seatPrice) : undefined,
        status: values.status,
        note: values.note || undefined,
      };

      if (formMode === 'add') {
        await createBookingApi(payload as CreateBookingPayload);
      } else if (selectedBooking) {
        await updateBookingApi(selectedBooking.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message:
          formMode === 'add'
            ? 'Tạo booking thành công.'
            : 'Cập nhật booking thành công.',
      });

      loadData();
      loadSelectOptions();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi lưu booking',
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = useMemo<GridColDef<BookingItem>[]>(() => {
    const baseColumns: GridColDef<BookingItem>[] = [
      {
        field: 'bookingCode',
        headerName: 'Mã booking',
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
        field: 'customerName',
        headerName: 'Khách hàng',
        flex: 1,
        minWidth: 190,
      },
      {
        field: 'customerPhone',
        headerName: 'SĐT',
        width: 130,
      },
      {
        field: 'trip',
        headerName: 'Chuyến',
        flex: 1,
        minWidth: 240,
        sortable: false,
        renderCell: (params) => {
          const trip = params.row.trip;

          if (!trip) return '-';

          return `${trip.route?.name || '-'} - ${formatDateTime(
            trip.departureTime,
          )}`;
        },
      },
      {
        field: 'driver',
        headerName: 'Tài xế',
        flex: 1,
        minWidth: 190,
        sortable: false,
        renderCell: (params) => {
          const driver = params.row.trip?.driver;

          if (!driver) return '-';

          return `${driver.fullName} - ${driver.phone}`;
        },
      },
      {
        field: 'passengerCount',
        headerName: 'Số khách',
        width: 100,
      },
      {
        field: 'totalAmount',
        headerName: 'Tổng tiền',
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
              label={getBookingStatusLabel(status)}
              color={getBookingStatusColor(status) as any}
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
            Quản lý booking
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Quản lý đặt chỗ, số khách, điểm đón trả và trạng thái booking theo
            từng chuyến xe.
          </Typography>
        </Box>

        <HDataTable<BookingItem, BookingSearchForm>
          title="Danh sách booking"
          description="Tạo booking, cập nhật trạng thái và theo dõi khách theo chuyến."
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
                Thêm booking
              </Button>
            ) : null
          }
          searchContent={
            <>
              <HInput<BookingSearchForm>
                name="keyword"
                label="Tìm mã, tên khách, SĐT, tuyến, xe"
              />

              {currentRole === 'SUPER_ADMIN' && (
                <HDropdown<BookingSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              {currentRole !== 'DRIVER' && (
                <>
                  <HDropdown<BookingSearchForm>
                    name="tripId"
                    label="Chuyến xe"
                    placeholder="Tất cả chuyến"
                    options={tripOptions}
                  />

                  <HDropdown<BookingSearchForm>
                    name="routeId"
                    label="Tuyến đường"
                    placeholder="Tất cả tuyến"
                    options={routeOptions}
                  />

                  <HDropdown<BookingSearchForm>
                    name="driverId"
                    label="Tài xế"
                    placeholder="Tất cả tài xế"
                    options={driverOptions}
                  />
                </>
              )}

              <HDropdown<BookingSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    label: 'Chờ xác nhận',
                    value: 'PENDING',
                  },
                  {
                    label: 'Đã xác nhận',
                    value: 'CONFIRMED',
                  },
                  {
                    label: 'Đã đón khách',
                    value: 'PICKED_UP',
                  },
                  {
                    label: 'Hoàn thành',
                    value: 'COMPLETED',
                  },
                  {
                    label: 'Đã hủy',
                    value: 'CANCELED',
                  },
                  {
                    label: 'Khách không đi',
                    value: 'NO_SHOW',
                  },
                ]}
              />

              <HDatePicker<BookingSearchForm>
                name="fromDate"
                label="Từ ngày"
              />

              <HDatePicker<BookingSearchForm>
                name="toDate"
                label="Đến ngày"
              />
            </>
          }
        />

        <BookingFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedBooking}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          tripOptions={tripOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitBookingForm}
        />
      </Box>
    </AdminLayout>
  );
}