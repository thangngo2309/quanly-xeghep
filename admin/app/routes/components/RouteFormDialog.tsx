'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { UserRole } from '@/api/users.api';
import type {
  TransportRouteItem,
  TransportRouteStatus,
} from '@/api/routes.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type CompanyOption = {
  label: string;
  value: string;
};

export type RouteFormValues = {
  companyId: string;
  name: string;
  origin: string;
  destination: string;
  stopsText: string;
  distanceKm: string;
  estimatedDurationMinutes: string;
  status: TransportRouteStatus;
  note: string;
};

type RouteFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: TransportRouteItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: CompanyOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<RouteFormValues>;
};

const defaultValues: RouteFormValues = {
  companyId: '',
  name: '',
  origin: '',
  destination: '',
  stopsText: '',
  distanceKm: '',
  estimatedDurationMinutes: '',
  status: 'ACTIVE',
  note: '',
};

export function RouteFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  onClose,
  onSubmit,
}: RouteFormDialogProps) {
  const methods = useForm<RouteFormValues>({
    defaultValues,
  });

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        name: initialValues.name || '',
        origin: initialValues.origin || '',
        destination: initialValues.destination || '',
        stopsText: initialValues.stops?.join(', ') || '',
        distanceKm:
          initialValues.distanceKm !== null &&
          initialValues.distanceKm !== undefined
            ? String(initialValues.distanceKm)
            : '',
        estimatedDurationMinutes: initialValues.estimatedDurationMinutes
          ? String(initialValues.estimatedDurationMinutes)
          : '',
        status: initialValues.status || 'ACTIVE',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<RouteFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm tuyến đường' : 'Cập nhật tuyến đường'}
      description={
        mode === 'add'
          ? 'Tạo tuyến đường cố định cho nhà xe khai thác.'
          : 'Cập nhật thông tin tuyến đường.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo tuyến' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<RouteFormValues>
          name="companyId"
          label="Nhà xe"
          placeholder="Chọn nhà xe"
          options={companyOptions}
          disabled={companyOptions.length === 0}
          helperText={
            companyOptions.length === 0
              ? 'Chưa có nhà xe hoạt động để chọn'
              : undefined
          }
          rules={{
            required: 'Vui lòng chọn nhà xe',
          }}
          sx={{
            gridColumn: {
              xs: 'auto',
              md: '1 / -1',
            },
          }}
        />
      )}

      <HInput<RouteFormValues>
        name="name"
        label="Tên tuyến"
        placeholder="Ví dụ: Huế - Đà Nẵng - Hội An"
        rules={{
          required: 'Vui lòng nhập tên tuyến',
        }}
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteFormValues>
        name="origin"
        label="Điểm đi"
        placeholder="Ví dụ: Huế"
        rules={{
          required: 'Vui lòng nhập điểm đi',
        }}
      />

      <HInput<RouteFormValues>
        name="destination"
        label="Điểm đến"
        placeholder="Ví dụ: Hội An"
        rules={{
          required: 'Vui lòng nhập điểm đến',
        }}
      />

      <HInput<RouteFormValues>
        name="stopsText"
        label="Điểm dừng trung gian"
        placeholder="Ví dụ: Đà Nẵng, Lăng Cô"
        helperText="Nhập nhiều điểm, cách nhau bằng dấu phẩy."
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteFormValues>
        name="distanceKm"
        label="Quãng đường"
        type="number"
        placeholder="Ví dụ: 130"
      />

      <HInput<RouteFormValues>
        name="estimatedDurationMinutes"
        label="Thời gian dự kiến"
        type="number"
        placeholder="Ví dụ: 210 phút"
      />

      <HDropdown<RouteFormValues>
        name="status"
        label="Trạng thái"
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
        rules={{
          required: 'Vui lòng chọn trạng thái',
        }}
      />

      <HInput<RouteFormValues>
        name="note"
        label="Ghi chú"
        multiline
        rows={2}
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />
    </HFormDialog>
  );
}