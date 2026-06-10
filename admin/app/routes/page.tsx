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
  assignDriverToRouteApi,
  createRouteApi,
  deleteRouteApi,
  endRouteDriverAssignmentApi,
  getRouteDriversApi,
  getRoutesApi,
  updateRouteApi,
  type CreateRoutePayload,
  type RouteDriverAssignmentItem,
  type TransportRouteItem,
  type TransportRouteStatus,
  type UpdateRoutePayload,
} from '@/api/routes.api';
import { getUsersApi, type UserRole } from '@/api/users.api';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';
import { getAuthUser } from '@/helper/auth-storage';

import {
  AssignRouteDriverDialog,
  type AssignRouteDriverFormValues,
  type DriverOption,
} from './components/AssignRouteDriverDialog';
import {
  RouteDriversDialog,
} from './components/RouteDriversDialog';
import {
  RouteFormDialog,
  type CompanyOption,
  type RouteFormValues,
} from './components/RouteFormDialog';
import { AdminLayout } from '../layouts/admin';

type RouteSearchForm = {
  keyword: string;
  companyId: string;
  status: TransportRouteStatus | '';
};

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseStopsText(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';

    case 'INACTIVE':
      return 'Ngưng hoạt động';

    default:
      return status;
  }
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return '-';

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  if (hour > 0 && minute > 0) {
    return `${hour} giờ ${minute} phút`;
  }

  if (hour > 0) {
    return `${hour} giờ`;
  }

  return `${minute} phút`;
}

export default function RoutesPage() {
  const dialog = useHDialog();

  const today = useMemo(() => getTodayDateString(), []);

  const searchMethods = useForm<RouteSearchForm>({
    defaultValues: {
      keyword: '',
      companyId: '',
      status: '',
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<TransportRouteItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);

  const [searchValues, setSearchValues] = useState<RouteSearchForm>({
    keyword: '',
    companyId: '',
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
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedRoute, setSelectedRoute] =
    useState<TransportRouteItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const [driversOpen, setDriversOpen] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [routeAssignments, setRouteAssignments] = useState<
    RouteDriverAssignmentItem[]
  >([]);

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
        })),
      );
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải nhà xe',
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

      const data = await getRoutesApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: (sort?.sort || 'desc') as 'asc' | 'desc',
        keyword: searchValues.keyword || undefined,
        companyId:
          currentRole === 'SUPER_ADMIN'
            ? searchValues.companyId || undefined
            : undefined,
        status: searchValues.status || undefined,
      });

      setRows(data.items);
      setRowCount(data.total);
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải dữ liệu',
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
    searchValues.status,
    sortModel,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDriverOptions = useCallback(
    async (route: TransportRouteItem) => {
      try {
        const data = await getUsersApi({
          page: 1,
          limit: 100,
          role: 'DRIVER',
          status: 'ACTIVE',
          companyId:
            currentRole === 'SUPER_ADMIN' ? route.companyId : undefined,
          sortBy: 'fullName',
          sortOrder: 'asc',
        });

        const users = Array.isArray(data) ? data : data.items;

        setDriverOptions(
          users.map((driver) => ({
            label: `${driver.fullName} - ${driver.phone}`,
            value: driver.id,
          })),
        );
      } catch (error) {
        setDriverOptions([]);

        await dialog.error({
          title: 'Lỗi tải tài xế',
          message: getApiErrorMessage(error),
        });
      }
    },
    [currentRole, dialog],
  );

  const loadRouteAssignments = useCallback(
    async (route: TransportRouteItem) => {
      setDriversLoading(true);

      try {
        const data = await getRouteDriversApi(route.id);
        setRouteAssignments(data);
      } catch (error) {
        setRouteAssignments([]);

        await dialog.error({
          title: 'Lỗi tải tài xế tuyến',
          message: getApiErrorMessage(error),
        });
      } finally {
        setDriversLoading(false);
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

  const handleSearch: SubmitHandler<RouteSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: RouteSearchForm = {
      keyword: '',
      companyId: '',
      status: '',
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  }

  const openCreateDialog = useCallback(() => {
    setSelectedRoute(null);
    setFormMode('add');
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((route: TransportRouteItem) => {
    setSelectedRoute(route);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const openAssignDialog = useCallback((route: TransportRouteItem) => {
    setSelectedRoute(route);
    setDriverOptions([]);
    setAssignOpen(true);
  }, []);

  useEffect(() => {
    if (!assignOpen || !selectedRoute) return;

    loadDriverOptions(selectedRoute);
  }, [assignOpen, selectedRoute, loadDriverOptions]);

  const openDriversDialog = useCallback(
    (route: TransportRouteItem) => {
      setSelectedRoute(route);
      setRouteAssignments([]);
      setDriversOpen(true);
      loadRouteAssignments(route);
    },
    [loadRouteAssignments],
  );

  const handleDelete = useCallback(
    async (route: TransportRouteItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa tuyến "${route.name}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteRouteApi(route.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa tuyến đường thành công.',
        });

        loadData();
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa tuyến',
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData],
  );

  const handleSubmitRouteForm: SubmitHandler<RouteFormValues> = async (
    values,
  ) => {
    setFormLoading(true);

    try {
      const payload: CreateRoutePayload | UpdateRoutePayload = {
        companyId:
          currentRole === 'SUPER_ADMIN' ? values.companyId : undefined,
        name: values.name,
        origin: values.origin,
        destination: values.destination,
        stops: parseStopsText(values.stopsText),
        distanceKm: values.distanceKm
          ? Number(values.distanceKm)
          : undefined,
        estimatedDurationMinutes: values.estimatedDurationMinutes
          ? Number(values.estimatedDurationMinutes)
          : undefined,
        status: values.status,
        note: values.note || undefined,
      };

      if (formMode === 'add') {
        await createRouteApi(payload as CreateRoutePayload);
      } else if (selectedRoute) {
        await updateRouteApi(selectedRoute.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message:
          formMode === 'add'
            ? 'Tạo tuyến đường thành công.'
            : 'Cập nhật tuyến đường thành công.',
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi lưu tuyến',
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitAssignForm: SubmitHandler<
    AssignRouteDriverFormValues
  > = async (values) => {
    if (!selectedRoute) return;

    setAssignLoading(true);

    try {
      await assignDriverToRouteApi(selectedRoute.id, {
        driverId: values.driverId,
        startedAt: values.startedAt || undefined,
        note: values.note || undefined,
      });

      setAssignOpen(false);

      await dialog.info({
        title: 'Thành công',
        message: 'Đã phân tài xế vào tuyến thành công.',
      });

      loadData();

      if (driversOpen) {
        loadRouteAssignments(selectedRoute);
      }
    } catch (error) {
      await dialog.error({
        title: 'Lỗi phân tài xế',
        message: getApiErrorMessage(error),
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleEndAssignment = useCallback(
    async (assignment: RouteDriverAssignmentItem) => {
      if (!selectedRoute) return;

      const ok = await dialog.confirm({
        title: 'Kết thúc phân công',
        message: `Bạn có chắc chắn muốn kết thúc phân công tài xế "${
          assignment.driver?.fullName || ''
        }" khỏi tuyến này không?`,
        confirmText: 'Kết thúc',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      setDriversLoading(true);

      try {
        await endRouteDriverAssignmentApi(selectedRoute.id, assignment.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã kết thúc phân công tài xế.',
        });

        await loadRouteAssignments(selectedRoute);
      } catch (error) {
        await dialog.error({
          title: 'Lỗi kết thúc phân công',
          message: getApiErrorMessage(error),
        });
      } finally {
        setDriversLoading(false);
      }
    },
    [dialog, loadRouteAssignments, selectedRoute],
  );

  const columns = useMemo<GridColDef<TransportRouteItem>[]>(
    () => {
      const baseColumns: GridColDef<TransportRouteItem>[] = [
        {
          field: 'name',
          headerName: 'Tên tuyến',
          flex: 1,
          minWidth: 220,
        },
      ];

      if (currentRole === 'SUPER_ADMIN') {
        baseColumns.push({
          field: 'company',
          headerName: 'Nhà xe',
          flex: 1,
          minWidth: 200,
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
          field: 'origin',
          headerName: 'Điểm đi',
          width: 150,
        },
        {
          field: 'destination',
          headerName: 'Điểm đến',
          width: 150,
        },
        {
          field: 'stops',
          headerName: 'Điểm dừng',
          flex: 1,
          minWidth: 180,
          sortable: false,
          renderCell: (params) => {
            const stops = params.row.stops;

            if (!stops?.length) return '-';

            return stops.join(', ');
          },
        },
        {
          field: 'distanceKm',
          headerName: 'Km',
          width: 100,
          renderCell: (params) => {
            if (!params.value) return '-';

            return `${params.value} km`;
          },
        },
        {
          field: 'estimatedDurationMinutes',
          headerName: 'Thời gian',
          width: 130,
          renderCell: (params) =>
            formatDuration(Number(params.value || 0)),
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
                label={getStatusLabel(status)}
                color={status === 'ACTIVE' ? 'success' : 'default'}
              />
            );
          },
        },
        {
          field: 'actions',
          headerName: 'Thao tác',
          width: 300,
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
                onClick={(event) => {
                  event.stopPropagation();
                  openAssignDialog(params.row);
                }}
              >
                Phân TX
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation();
                  openDriversDialog(params.row);
                }}
              >
                DS TX
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
    [
      currentRole,
      handleDelete,
      openAssignDialog,
      openDriversDialog,
      openEditDialog,
    ],
  );

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Quản lý tuyến đường
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Quản lý tuyến khai thác cố định của từng nhà xe và phân tài xế theo
            tuyến.
          </Typography>
        </Box>

        <HDataTable<TransportRouteItem, RouteSearchForm>
          title="Danh sách tuyến đường"
          description="Tạo tuyến, cập nhật tuyến và phân tài xế khai thác tuyến."
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
              Thêm tuyến
            </Button>
          }
          searchContent={
            <>
              <HInput<RouteSearchForm>
                name="keyword"
                label="Tìm tên tuyến, điểm đi, điểm đến"
              />

              {currentRole === 'SUPER_ADMIN' && (
                <HDropdown<RouteSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              <HDropdown<RouteSearchForm>
                name="status"
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    label: 'Hoạt động',
                    value: 'ACTIVE',
                  },
                  {
                    label: 'Ngưng hoạt động',
                    value: 'INACTIVE',
                  },
                ]}
              />
            </>
          }
        />

        <RouteFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedRoute}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitRouteForm}
        />

        <AssignRouteDriverDialog
          open={assignOpen}
          route={selectedRoute}
          loading={assignLoading}
          initialDate={today}
          driverOptions={driverOptions}
          onClose={() => setAssignOpen(false)}
          onSubmit={handleSubmitAssignForm}
        />

        <RouteDriversDialog
          open={driversOpen}
          route={selectedRoute}
          loading={driversLoading}
          assignments={routeAssignments}
          onClose={() => setDriversOpen(false)}
          onEndAssignment={handleEndAssignment}
        />
      </Box>
    </AdminLayout>
  );
}