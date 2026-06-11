'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { RouteLineItem, RouteLineStatus } from '@/api/route-lines.api';
import type { UserRole } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type CompanyOption = {
  label: string;
  value: string;
};

export type RouteLineFormValues = {
  companyId: string;
  name: string;
  startPoint: string;
  endPoint: string;
  middleStopsText: string;
  defaultDurationMinutes: string;
  defaultTurnaroundMinutes: string;
  createReturnRoute: 'true' | 'false';
  status: RouteLineStatus;
  note: string;
};

type RouteLineFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: RouteLineItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: CompanyOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<RouteLineFormValues>;
};

const defaultValues: RouteLineFormValues = {
  companyId: '',
  name: '',
  startPoint: '',
  endPoint: '',
  middleStopsText: '',
  defaultDurationMinutes: '',
  defaultTurnaroundMinutes: '30',
  createReturnRoute: 'true',
  status: 'ACTIVE',
  note: '',
};

export function RouteLineFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  onClose,
  onSubmit,
}: RouteLineFormDialogProps) {
  const methods = useForm<RouteLineFormValues>({
    defaultValues,
  });

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        name: initialValues.name || '',
        startPoint: initialValues.startPoint || '',
        endPoint: initialValues.endPoint || '',
        middleStopsText: initialValues.middleStops?.join(', ') || '',
        defaultDurationMinutes: initialValues.defaultDurationMinutes
          ? String(initialValues.defaultDurationMinutes)
          : '',
        defaultTurnaroundMinutes:
          initialValues.defaultTurnaroundMinutes !== null &&
          initialValues.defaultTurnaroundMinutes !== undefined
            ? String(initialValues.defaultTurnaroundMinutes)
            : '30',
        createReturnRoute: 'true',
        status: initialValues.status || 'ACTIVE',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<RouteLineFormValues>
      open={open}
      mode={mode}
      title={
        mode === 'add' ? 'Thêm tuyến khai thác' : 'Cập nhật tuyến khai thác'
      }
      description="Tuyến khai thác là tuyến hai chiều, ví dụ Đà Nẵng ⇄ Huế. Hệ thống sẽ tự sinh tuyến một chiều đi và về."
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo tuyến' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<RouteLineFormValues>
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

      <HInput<RouteLineFormValues>
        name="name"
        label="Tên tuyến khai thác"
        placeholder="Để trống sẽ tự tạo: Đà Nẵng ⇄ Huế"
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteLineFormValues>
        name="startPoint"
        label="Điểm đầu"
        placeholder="Ví dụ: Đà Nẵng"
        rules={{
          required: 'Vui lòng nhập điểm đầu',
        }}
      />

      <HInput<RouteLineFormValues>
        name="endPoint"
        label="Điểm cuối"
        placeholder="Ví dụ: Huế"
        rules={{
          required: 'Vui lòng nhập điểm cuối',
        }}
      />

      <HInput<RouteLineFormValues>
        name="middleStopsText"
        label="Điểm trung gian"
        placeholder="Ví dụ: Lăng Cô, Phú Bài"
        helperText="Nhập nhiều điểm, cách nhau bằng dấu phẩy."
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteLineFormValues>
        name="defaultDurationMinutes"
        label="Thời gian chạy mặc định"
        type="number"
        helperText="Đơn vị phút. Ví dụ: 150"
      />

      <HInput<RouteLineFormValues>
        name="defaultTurnaroundMinutes"
        label="Thời gian quay đầu mặc định"
        type="number"
        helperText="Đơn vị phút. Ví dụ: 30"
      />

      {mode === 'add' && (
        <HDropdown<RouteLineFormValues>
          name="createReturnRoute"
          label="Tự tạo chiều về"
          options={[
            { label: 'Có', value: 'true' },
            { label: 'Không', value: 'false' },
          ]}
        />
      )}

      <HDropdown<RouteLineFormValues>
        name="status"
        label="Trạng thái"
        options={[
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Ngưng hoạt động', value: 'INACTIVE' },
        ]}
      />

      <HInput<RouteLineFormValues>
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