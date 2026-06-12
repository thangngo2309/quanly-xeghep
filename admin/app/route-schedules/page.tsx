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
import { getRouteLinesApi } from '@/api/route-lines.api';
import {
  addVehicleToRouteScheduleApi,
  createRouteScheduleApi,
  deleteRouteScheduleApi,
  generateRouteScheduleTripsApi,
  getRouteScheduleApi,
  getRouteSchedulesApi,
  removeVehicleFromRouteScheduleApi,
  type CreateRouteSchedulePayload,
  type RouteScheduleStatus,
  type RouteScheduleTemplateItem,
  type RouteScheduleVehicleItem,
} from '@/api/route-schedules.api';
import { getUsersApi, type UserRole } from '@/api/users.api';
import { getVehiclesApi } from '@/api/vehicles.api';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HAutocomplete, HDropdown, HInput } from '@/components/form';
import { getAuthUser } from '@/helper/auth-storage';
import { AdminLayout } from '../layouts/admin';

import {
  GenerateTripsDialog,
  type GenerateTripsFormValues,
} from './components/GenerateTripsDialog';
import {
  RouteScheduleFormDialog,
  type RouteScheduleFormValues,
  type SelectOption,
} from './components/RouteScheduleFormDialog';
import {
  ScheduleVehicleDialog,
  type ScheduleVehicleFormValues,
} from './components/ScheduleVehicleDialog';
import { ScheduleVehiclesDialog } from './components/ScheduleVehiclesDialog';

type RouteScheduleSearchForm = {
  keyword: string;
  companyId: string;
  routeLineId: string;
  status: RouteScheduleStatus | '';
};

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStatusLabel(status: string) {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động';
}

function getTripStatusLabel(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'Đã lên lịch';

    case 'OPEN':
      return 'Mở nhận khách';

    default:
      return status;
  }
}

function getDayLabels(days: number[]) {
  const map: Record<number, string> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  };

  return days.map((day) => map[day] || String(day)).join(', ');
}

export default function RouteSchedulesPage() {
  const dialog = useHDialog();

  const today = useMemo(() => getTodayDateString(), []);

  const searchMethods = useForm<RouteScheduleSearchForm>({
    defaultValues: {
      keyword: '',
      companyId: '',
      routeLineId: '',
      status: '',
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<RouteScheduleTemplateItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [routeLineOptions, setRouteLineOptions] = useState<SelectOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);

  const [searchValues, setSearchValues] = useState<RouteScheduleSearchForm>({
    keyword: '',
    companyId: '',
    routeLineId: '',
    status: '',
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
  const [formLoading, setFormLoading] = useState(false);

  const [selectedSchedule, setSelectedSchedule] =
    useState<RouteScheduleTemplateItem | null>(null);

  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleFormLoading, setVehicleFormLoading] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

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
      const [routeLinesData, vehiclesData, driversData] = await Promise.all([
        getRouteLinesApi({
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

      setRouteLineOptions(
        routeLinesData.items.map((routeLine) => ({
          label:
            currentRole === 'SUPER_ADMIN' && routeLine.company
              ? `${routeLine.name} - ${routeLine.company.name}`
              : routeLine.name,
          value: routeLine.id,
          companyId: routeLine.companyId,
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

      const data = await getRouteSchedulesApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: (sort?.sort || 'desc') as 'asc' | 'desc',
        keyword: searchValues.keyword || undefined,
        companyId:
          currentRole === 'SUPER_ADMIN'
            ? searchValues.companyId || undefined
            : undefined,
        routeLineId: searchValues.routeLineId || undefined,
        status: searchValues.status || undefined,
      });

      setRows(data.items);
      setRowCount(data.total);
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải lịch chạy tuyến',
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
    searchValues.keyword,
    searchValues.routeLineId,
    searchValues.status,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadScheduleDetail = useCallback(
    async (scheduleId: string) => {
      setVehiclesLoading(true);

      try {
        const data = await getRouteScheduleApi(scheduleId);
        setSelectedSchedule(data);
      } catch (error) {
        await dialog.error({
          title: 'Lỗi tải xe vòng quay',
          message: getApiErrorMessage(error),
        });
      } finally {
        setVehiclesLoading(false);
      }
    },
    [dialog],
  );

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

  const handleSearch: SubmitHandler<RouteScheduleSearchForm> = (values) => {
    setSearchValues(values);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  function handleResetSearch() {
    const emptyValues: RouteScheduleSearchForm = {
      keyword: '',
      companyId: '',
      routeLineId: '',
      status: '',
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

  const openCreateDialog = useCallback(() => {
    setFormOpen(true);
  }, []);

  const openVehiclesDialog = useCallback(
    async (schedule: RouteScheduleTemplateItem) => {
      setSelectedSchedule(schedule);
      setVehiclesOpen(true);
      await loadScheduleDetail(schedule.id);
    },
    [loadScheduleDetail],
  );

  const openGenerateDialog = useCallback((schedule: RouteScheduleTemplateItem) => {
    setSelectedSchedule(schedule);
    setGenerateOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (schedule: RouteScheduleTemplateItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa lịch "${schedule.name}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteRouteScheduleApi(schedule.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa lịch chạy tuyến thành công.',
        });

        loadData();
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa lịch',
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData],
  );

  const handleSubmitScheduleForm: SubmitHandler<
    RouteScheduleFormValues
  > = async (values) => {
    if (!values.daysOfWeek.length) {
      await dialog.error({
        title: 'Thiếu ngày áp dụng',
        message: 'Vui lòng chọn ít nhất một ngày áp dụng.',
      });
      return;
    }

    setFormLoading(true);

    try {
      const payload: CreateRouteSchedulePayload = {
        routeLineId: values.routeLineId,
        name: values.name || undefined,
        startTime: values.startTime,
        endTime: values.endTime,
        headwayMinutes: Number(values.headwayMinutes),
        outboundDurationMinutes: Number(values.outboundDurationMinutes),
        returnDurationMinutes: Number(values.returnDurationMinutes),
        turnaroundAtEndMinutes: values.turnaroundAtEndMinutes
          ? Number(values.turnaroundAtEndMinutes)
          : undefined,
        turnaroundAtStartMinutes: values.turnaroundAtStartMinutes
          ? Number(values.turnaroundAtStartMinutes)
          : undefined,
        daysOfWeek: values.daysOfWeek,
        generateDaysAhead: values.generateDaysAhead
          ? Number(values.generateDaysAhead)
          : undefined,
        defaultBasePrice: values.defaultBasePrice
          ? Number(values.defaultBasePrice)
          : undefined,
        defaultTripStatus: values.defaultTripStatus,
        status: values.status,
        note: values.note || undefined,
      };

      await createRouteScheduleApi(payload);

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message: 'Tạo lịch chạy tuyến thành công.',
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tạo lịch',
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitVehicleForm: SubmitHandler<
    ScheduleVehicleFormValues
  > = async (values) => {
    if (!selectedSchedule) return;

    setVehicleFormLoading(true);

    try {
      await addVehicleToRouteScheduleApi(selectedSchedule.id, {
        vehicleId: values.vehicleId,
        driverId: values.driverId || undefined,
        startDirection: values.startDirection,
        firstDepartureTime: values.firstDepartureTime,
        activeFrom: values.activeFrom,
        activeTo: values.activeTo || undefined,
        status: values.status,
        note: values.note || undefined,
      });

      setVehicleFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message: 'Đã thêm xe vào vòng quay.',
      });

      await loadScheduleDetail(selectedSchedule.id);
    } catch (error) {
      await dialog.error({
        title: 'Lỗi thêm xe',
        message: getApiErrorMessage(error),
      });
    } finally {
      setVehicleFormLoading(false);
    }
  };

  const handleRemoveVehicle = useCallback(
    async (item: RouteScheduleVehicleItem) => {
      if (!selectedSchedule) return;

      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Xóa xe "${
          item.vehicle?.licensePlate || ''
        }" khỏi vòng quay?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      setVehiclesLoading(true);

      try {
        await removeVehicleFromRouteScheduleApi(selectedSchedule.id, item.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa xe khỏi vòng quay.',
        });

        await loadScheduleDetail(selectedSchedule.id);
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa xe vòng quay',
          message: getApiErrorMessage(error),
        });
      } finally {
        setVehiclesLoading(false);
      }
    },
    [dialog, loadScheduleDetail, selectedSchedule],
  );

  const handleSubmitGenerateForm: SubmitHandler<
    GenerateTripsFormValues
  > = async (values) => {
    if (!selectedSchedule) return;

    setGenerateLoading(true);

    try {
      const result = await generateRouteScheduleTripsApi(selectedSchedule.id, {
        fromDate: values.fromDate || undefined,
        toDate: values.toDate || undefined,
      });

      setGenerateOpen(false);

      await dialog.info({
        title: 'Sinh chuyến hoàn tất',
        message: `Đã tạo ${result.createdCount} chuyến. Bỏ qua ${result.skippedCount} chuyến.`,
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi sinh chuyến',
        message: getApiErrorMessage(error),
      });
    } finally {
      setGenerateLoading(false);
    }
  };

  const columns = useMemo<GridColDef<RouteScheduleTemplateItem>[]>(
    () => {
      const baseColumns: GridColDef<RouteScheduleTemplateItem>[] = [
        {
          field: 'name',
          headerName: 'Tên lịch',
          flex: 1,
          minWidth: 230,
        },
      ];

      if (currentRole === 'SUPER_ADMIN') {
        baseColumns.push({
          field: 'company',
          headerName: 'Nhà xe',
          flex: 1,
          minWidth: 190,
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
          field: 'routeLine',
          headerName: 'Tuyến',
          flex: 1,
          minWidth: 200,
          sortable: false,
          renderCell: (params) => params.row.routeLine?.name || '-',
        },
        {
          field: 'timeRange',
          headerName: 'Khung giờ',
          width: 130,
          sortable: false,
          renderCell: (params) =>
            `${params.row.startTime} - ${params.row.endTime}`,
        },
        {
          field: 'headwayMinutes',
          headerName: 'Tần suất',
          width: 110,
          renderCell: (params) => `${params.value} phút`,
        },
        {
          field: 'daysOfWeek',
          headerName: 'Ngày chạy',
          width: 150,
          sortable: false,
          renderCell: (params) => getDayLabels(params.row.daysOfWeek || []),
        },
        {
          field: 'defaultTripStatus',
          headerName: 'Chuyến tạo ra',
          width: 140,
          renderCell: (params) => getTripStatusLabel(String(params.value)),
        },
        {
          field: 'status',
          headerName: 'Trạng thái',
          width: 140,
          renderCell: (params) => {
            const status = String(params.value);

            return (
              <Chip
                size="small"
                label={getStatusLabel(status)}
                color={status === 'ACTIVE' ? 'success' : 'default'}
              />
            );
          },
        },
        {
          field: 'actions',
          headerName: 'Thao tác',
          width: 270,
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
                  openVehiclesDialog(params.row);
                }}
              >
                Xe
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation();
                  openGenerateDialog(params.row);
                }}
              >
                Sinh chuyến
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
      );

      return baseColumns;
    },
    [currentRole, handleDelete, openGenerateDialog, openVehiclesDialog],
  );

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Lịch chạy tuyến
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Cấu hình lịch chạy, xe vòng quay và sinh chuyến xe tự động theo
            ngày.
          </Typography>
        </Box>

        <HDataTable<RouteScheduleTemplateItem, RouteScheduleSearchForm>
          title="Danh sách lịch chạy"
          description="Tạo lịch mẫu, thêm xe vòng quay và sinh chuyến tự động."
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
            <Button
              variant="contained"
              onClick={(event) => {
                event.stopPropagation();
                openCreateDialog();
              }}
            >
              Thêm lịch
            </Button>
          }
          searchContent={
            <>
              <HInput<RouteScheduleSearchForm>
                name="keyword"
                label="Tìm lịch, tuyến, nhà xe"
              />

              {currentRole === 'SUPER_ADMIN' && (
                <HAutocomplete<RouteScheduleSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              <HAutocomplete<RouteScheduleSearchForm>
                name="routeLineId"
                label="Tuyến khai thác"
                placeholder="Tất cả tuyến"
                options={routeLineOptions}
              />

              <HDropdown<RouteScheduleSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  { label: 'Hoạt động', value: 'ACTIVE' },
                  { label: 'Ngưng hoạt động', value: 'INACTIVE' },
                ]}
              />
            </>
          }
        />

        <RouteScheduleFormDialog
          open={formOpen}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          routeLineOptions={routeLineOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitScheduleForm}
        />

        <ScheduleVehiclesDialog
          open={vehiclesOpen}
          schedule={selectedSchedule}
          loading={vehiclesLoading}
          onClose={() => setVehiclesOpen(false)}
          onAddVehicle={() => setVehicleFormOpen(true)}
          onRemoveVehicle={handleRemoveVehicle}
        />

        <ScheduleVehicleDialog
          open={vehicleFormOpen}
          schedule={selectedSchedule}
          loading={vehicleFormLoading}
          initialDate={today}
          vehicleOptions={vehicleOptions}
          driverOptions={driverOptions}
          onClose={() => setVehicleFormOpen(false)}
          onSubmit={handleSubmitVehicleForm}
        />

        <GenerateTripsDialog
          open={generateOpen}
          schedule={selectedSchedule}
          loading={generateLoading}
          initialDate={today}
          onClose={() => setGenerateOpen(false)}
          onSubmit={handleSubmitGenerateForm}
        />
      </Box>
    </AdminLayout>
  );
}