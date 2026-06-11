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
  createRouteLineApi,
  deleteRouteLineApi,
  getRouteLinesApi,
  updateRouteLineApi,
  type CreateRouteLinePayload,
  type RouteLineItem,
  type RouteLineStatus,
  type UpdateRouteLinePayload,
} from '@/api/route-lines.api';
import { getAuthUser } from '@/helper/auth-storage';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';
import { AdminLayout } from '../layouts/admin';

import {
  RouteLineFormDialog,
  type CompanyOption,
  type RouteLineFormValues,
} from './components/RouteLineFormDialog';
import type { UserRole } from '@/api/users.api';

type RouteLineSearchForm = {
  keyword: string;
  companyId: string;
  status: RouteLineStatus | '';
};

function parseStopsText(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStatusLabel(status: string) {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động';
}

export default function RouteLinesPage() {
  const dialog = useHDialog();

  const searchMethods = useForm<RouteLineSearchForm>({
    defaultValues: {
      keyword: '',
      companyId: '',
      status: '',
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [rows, setRows] = useState<RouteLineItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);

  const [searchValues, setSearchValues] = useState<RouteLineSearchForm>({
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
  const [selectedRouteLine, setSelectedRouteLine] =
    useState<RouteLineItem | null>(null);
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

      const data = await getRouteLinesApi({
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
        title: 'Lỗi tải tuyến khai thác',
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

  const handleSearch: SubmitHandler<RouteLineSearchForm> = (values) => {
    setSearchValues(values);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  function handleResetSearch() {
    const emptyValues: RouteLineSearchForm = {
      keyword: '',
      companyId: '',
      status: '',
    };

    searchMethods.reset(emptyValues);
    setSearchValues(emptyValues);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

  const openCreateDialog = useCallback(() => {
    setSelectedRouteLine(null);
    setFormMode('add');
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((routeLine: RouteLineItem) => {
    setSelectedRouteLine(routeLine);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (routeLine: RouteLineItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa tuyến "${routeLine.name}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteRouteLineApi(routeLine.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa tuyến khai thác thành công.',
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

  const handleSubmitForm: SubmitHandler<RouteLineFormValues> = async (
    values,
  ) => {
    setFormLoading(true);

    try {
      const payload: CreateRouteLinePayload | UpdateRouteLinePayload = {
        companyId:
          currentRole === 'SUPER_ADMIN' ? values.companyId : undefined,
        name: values.name || undefined,
        startPoint: values.startPoint,
        endPoint: values.endPoint,
        middleStops: parseStopsText(values.middleStopsText),
        defaultDurationMinutes: values.defaultDurationMinutes
          ? Number(values.defaultDurationMinutes)
          : undefined,
        defaultTurnaroundMinutes: values.defaultTurnaroundMinutes
          ? Number(values.defaultTurnaroundMinutes)
          : undefined,
        createReturnRoute: values.createReturnRoute === 'true',
        status: values.status,
        note: values.note || undefined,
      };

      if (formMode === 'add') {
        await createRouteLineApi(payload as CreateRouteLinePayload);
      } else if (selectedRouteLine) {
        await updateRouteLineApi(selectedRouteLine.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message:
          formMode === 'add'
            ? 'Tạo tuyến khai thác thành công.'
            : 'Cập nhật tuyến khai thác thành công.',
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

  const columns = useMemo<GridColDef<RouteLineItem>[]>(
    () => {
      const baseColumns: GridColDef<RouteLineItem>[] = [
        {
          field: 'name',
          headerName: 'Tuyến khai thác',
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
          field: 'startPoint',
          headerName: 'Điểm đầu',
          width: 150,
        },
        {
          field: 'endPoint',
          headerName: 'Điểm cuối',
          width: 150,
        },
        {
          field: 'middleStops',
          headerName: 'Điểm trung gian',
          flex: 1,
          minWidth: 190,
          sortable: false,
          renderCell: (params) => {
            const stops = params.row.middleStops;

            if (!stops?.length) return '-';

            return stops.join(', ');
          },
        },
        {
          field: 'defaultDurationMinutes',
          headerName: 'Thời gian',
          width: 120,
          renderCell: (params) => {
            if (!params.value) return '-';

            return `${params.value} phút`;
          },
        },
        {
          field: 'routes',
          headerName: 'Chiều',
          width: 100,
          sortable: false,
          renderCell: (params) => params.row.routes?.length || 0,
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
        },
      );

      return baseColumns;
    },
    [currentRole, handleDelete, openEditDialog],
  );

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Tuyến khai thác
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Quản lý tuyến hai chiều như Đà Nẵng ⇄ Huế và tự sinh các tuyến một
            chiều đi, về.
          </Typography>
        </Box>

        <HDataTable<RouteLineItem, RouteLineSearchForm>
          title="Danh sách tuyến khai thác"
          description="Tạo tuyến hai chiều, điểm trung gian và thời gian chạy mặc định."
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
              <HInput<RouteLineSearchForm>
                name="keyword"
                label="Tìm tuyến, điểm đầu, điểm cuối"
              />

              {currentRole === 'SUPER_ADMIN' && (
                <HDropdown<RouteLineSearchForm>
                  name="companyId"
                  label="Nhà xe"
                  placeholder="Tất cả nhà xe"
                  options={companyOptions}
                />
              )}

              <HDropdown<RouteLineSearchForm>
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

        <RouteLineFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedRouteLine}
          loading={formLoading}
          currentRole={currentRole}
          companyOptions={companyOptions}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitForm}
        />
      </Box>
    </AdminLayout>
  );
}