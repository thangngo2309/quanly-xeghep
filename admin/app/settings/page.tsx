'use client';

import { Box, Button, Chip, Typography } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/api/http';
import {
  createSettingApi,
  deleteSettingApi,
  getSettingsApi,
  updateSettingApi,
  type CreateSettingPayload,
  type SettingGroup,
  type SettingItem,
  type SettingStatus,
  type SettingValueType,
  type UpdateSettingPayload,
} from '@/api/settings.api';
import { HDataTable } from '@/components/datatable';
import { useHDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';
import { getAuthUser } from '@/helper/auth-storage';
import { AdminLayout } from '../layouts/admin';

import {
  SettingFormDialog,
  type SettingFormValues,
} from './components/SettingFormDialog';

type SettingSearchForm = {
  keyword: string;
  group: SettingGroup | '';
  valueType: SettingValueType | '';
  status: SettingStatus | '';
};

function getGroupLabel(group: SettingGroup | string) {
  switch (group) {
    case 'SYSTEM':
      return 'Hệ thống';

    case 'BOOKING':
      return 'Booking';

    case 'TRIP':
      return 'Chuyến xe';

    case 'CONTACT':
      return 'Liên hệ';

    case 'PAYMENT':
      return 'Thanh toán';

    case 'OTHER':
      return 'Khác';

    default:
      return group;
  }
}

function getValueTypeLabel(type: SettingValueType | string) {
  switch (type) {
    case 'STRING':
      return 'Chuỗi';

    case 'NUMBER':
      return 'Số';

    case 'BOOLEAN':
      return 'Đúng/Sai';

    case 'JSON':
      return 'JSON';

    case 'TEXT':
      return 'Văn bản dài';

    default:
      return type;
  }
}

function getStatusLabel(status: SettingStatus | string) {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';

    case 'INACTIVE':
      return 'Ngưng hoạt động';

    default:
      return status;
  }
}

function formatValue(value?: string | null) {
  if (!value) return '-';

  if (value.length > 80) {
    return `${value.slice(0, 80)}...`;
  }

  return value;
}

export default function SettingsPage() {
  const dialog = useHDialog();

  const searchMethods = useForm<SettingSearchForm>({
    defaultValues: {
      keyword: '',
      group: '',
      valueType: '',
      status: '',
    },
  });

  const [authReady, setAuthReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [rows, setRows] = useState<SettingItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchValues, setSearchValues] = useState<SettingSearchForm>({
    keyword: '',
    group: '',
    valueType: '',
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
  const [selectedSetting, setSelectedSetting] = useState<SettingItem | null>(
    null,
  );
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const user = getAuthUser();

    setIsSuperAdmin(user?.role === 'SUPER_ADMIN');
    setAuthReady(true);
  }, []);

  const loadData = useCallback(async () => {
    if (!authReady) return;

    if (!isSuperAdmin) {
      setRows([]);
      setRowCount(0);
      return;
    }

    setLoading(true);

    try {
      const sort = sortModel[0];

      const data = await getSettingsApi({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: (sort?.sort || 'desc') as 'asc' | 'desc',
        keyword: searchValues.keyword || undefined,
        group: searchValues.group || undefined,
        valueType: searchValues.valueType || undefined,
        status: searchValues.status || undefined,
      });

      setRows(data.items);
      setRowCount(data.total);
    } catch (error) {
      await dialog.error({
        title: 'Lỗi tải cấu hình',
        message: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [
    authReady,
    dialog,
    isSuperAdmin,
    paginationModel.page,
    paginationModel.pageSize,
    searchValues.group,
    searchValues.keyword,
    searchValues.status,
    searchValues.valueType,
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

  const handleSearch: SubmitHandler<SettingSearchForm> = (values) => {
    setSearchValues(values);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  function handleResetSearch() {
    const emptyValues: SettingSearchForm = {
      keyword: '',
      group: '',
      valueType: '',
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
    setSelectedSetting(null);
    setFormMode('add');
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((setting: SettingItem) => {
    setSelectedSetting(setting);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (setting: SettingItem) => {
      const ok = await dialog.confirm({
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa cấu hình "${setting.code}" không?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      });

      if (!ok) return;

      try {
        await deleteSettingApi(setting.id);

        await dialog.info({
          title: 'Thành công',
          message: 'Đã xóa cấu hình thành công.',
        });

        loadData();
      } catch (error) {
        await dialog.error({
          title: 'Lỗi xóa cấu hình',
          message: getApiErrorMessage(error),
        });
      }
    },
    [dialog, loadData],
  );

  const handleSubmitSettingForm: SubmitHandler<SettingFormValues> = async (
    values,
  ) => {
    setFormLoading(true);

    try {
      const payload: CreateSettingPayload | UpdateSettingPayload = {
        code: values.code,
        name: values.name,
        group: values.group,
        valueType: values.valueType,
        value: values.value || undefined,
        description: values.description || undefined,
        status: values.status,
      };

      if (formMode === 'add') {
        await createSettingApi(payload as CreateSettingPayload);
      } else if (selectedSetting) {
        await updateSettingApi(selectedSetting.id, payload);
      }

      setFormOpen(false);

      await dialog.info({
        title: 'Thành công',
        message:
          formMode === 'add'
            ? 'Tạo cấu hình thành công.'
            : 'Cập nhật cấu hình thành công.',
      });

      loadData();
    } catch (error) {
      await dialog.error({
        title: 'Lỗi lưu cấu hình',
        message: getApiErrorMessage(error),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = useMemo<GridColDef<SettingItem>[]>(
    () => [
      {
        field: 'code',
        headerName: 'Mã cấu hình',
        width: 190,
      },
      {
        field: 'name',
        headerName: 'Tên cấu hình',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'group',
        headerName: 'Nhóm',
        width: 130,
        renderCell: (params) => getGroupLabel(String(params.value)),
      },
      {
        field: 'valueType',
        headerName: 'Kiểu',
        width: 120,
        renderCell: (params) => getValueTypeLabel(String(params.value)),
      },
      {
        field: 'value',
        headerName: 'Giá trị',
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => formatValue(params.value as string | null),
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
    ],
    [handleDelete, openEditDialog],
  );

  if (authReady && !isSuperAdmin) {
    return (
      <AdminLayout>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Không có quyền truy cập
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 1 }}>
            Chỉ tài khoản SUPER_ADMIN được quản lý cấu hình hệ thống.
          </Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Cấu hình hệ thống
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Quản lý các tham số cấu hình chung của hệ thống.
          </Typography>
        </Box>

        <HDataTable<SettingItem, SettingSearchForm>
          title="Danh sách cấu hình"
          description="Tạo, cập nhật và quản lý các cấu hình hệ thống."
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
              Thêm cấu hình
            </Button>
          }
          searchContent={
            <>
              <HInput<SettingSearchForm>
                name="keyword"
                label="Tìm mã, tên cấu hình"
              />

              <HDropdown<SettingSearchForm>
                name="group"
                label="Nhóm"
                placeholder="Tất cả nhóm"
                options={[
                  { label: 'Hệ thống', value: 'SYSTEM' },
                  { label: 'Booking', value: 'BOOKING' },
                  { label: 'Chuyến xe', value: 'TRIP' },
                  { label: 'Liên hệ', value: 'CONTACT' },
                  { label: 'Thanh toán', value: 'PAYMENT' },
                  { label: 'Khác', value: 'OTHER' },
                ]}
              />

              <HDropdown<SettingSearchForm>
                name="valueType"
                label="Kiểu dữ liệu"
                placeholder="Tất cả kiểu"
                options={[
                  { label: 'Chuỗi', value: 'STRING' },
                  { label: 'Số', value: 'NUMBER' },
                  { label: 'Đúng/Sai', value: 'BOOLEAN' },
                  { label: 'JSON', value: 'JSON' },
                  { label: 'Văn bản dài', value: 'TEXT' },
                ]}
              />

              <HDropdown<SettingSearchForm>
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

        <SettingFormDialog
          open={formOpen}
          mode={formMode}
          initialValues={selectedSetting}
          loading={formLoading}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitSettingForm}
        />
      </Box>
    </AdminLayout>
  );
}