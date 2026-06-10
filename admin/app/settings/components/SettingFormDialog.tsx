'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type {
  SettingGroup,
  SettingItem,
  SettingStatus,
  SettingValueType,
} from '@/api/settings.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type SettingFormValues = {
  code: string;
  name: string;
  group: SettingGroup;
  valueType: SettingValueType;
  value: string;
  description: string;
  status: SettingStatus;
};

type SettingFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: SettingItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<SettingFormValues>;
};

const defaultValues: SettingFormValues = {
  code: '',
  name: '',
  group: 'OTHER',
  valueType: 'STRING',
  value: '',
  description: '',
  status: 'ACTIVE',
};

export function SettingFormDialog({
  open,
  mode,
  initialValues,
  loading,
  onClose,
  onSubmit,
}: SettingFormDialogProps) {
  const methods = useForm<SettingFormValues>({
    defaultValues,
  });

  const watchedValueType = methods.watch('valueType');

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        code: initialValues.code || '',
        name: initialValues.name || '',
        group: initialValues.group || 'OTHER',
        valueType: initialValues.valueType || 'STRING',
        value: initialValues.value || '',
        description: initialValues.description || '',
        status: initialValues.status || 'ACTIVE',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<SettingFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm cấu hình' : 'Cập nhật cấu hình'}
      description="Quản lý cấu hình chung của hệ thống."
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo cấu hình' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      <HInput<SettingFormValues>
        name="code"
        label="Mã cấu hình"
        placeholder="Ví dụ: SYSTEM_HOTLINE"
        rules={{
          required: 'Vui lòng nhập mã cấu hình',
        }}
      />

      <HInput<SettingFormValues>
        name="name"
        label="Tên cấu hình"
        placeholder="Ví dụ: Hotline hệ thống"
        rules={{
          required: 'Vui lòng nhập tên cấu hình',
        }}
      />

      <HDropdown<SettingFormValues>
        name="group"
        label="Nhóm cấu hình"
        options={[
          { label: 'Hệ thống', value: 'SYSTEM' },
          { label: 'Booking', value: 'BOOKING' },
          { label: 'Chuyến xe', value: 'TRIP' },
          { label: 'Liên hệ', value: 'CONTACT' },
          { label: 'Thanh toán', value: 'PAYMENT' },
          { label: 'Khác', value: 'OTHER' },
        ]}
      />

      <HDropdown<SettingFormValues>
        name="valueType"
        label="Kiểu dữ liệu"
        options={[
          { label: 'Chuỗi', value: 'STRING' },
          { label: 'Số', value: 'NUMBER' },
          { label: 'Đúng/Sai', value: 'BOOLEAN' },
          { label: 'JSON', value: 'JSON' },
          { label: 'Văn bản dài', value: 'TEXT' },
        ]}
      />

      {watchedValueType === 'BOOLEAN' ? (
        <HDropdown<SettingFormValues>
          name="value"
          label="Giá trị"
          placeholder="Chọn giá trị"
          options={[
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ]}
          sx={{
            gridColumn: {
              xs: 'auto',
              md: '1 / -1',
            },
          }}
        />
      ) : (
        <HInput<SettingFormValues>
          name="value"
          label="Giá trị"
          multiline={watchedValueType === 'JSON' || watchedValueType === 'TEXT'}
          rows={watchedValueType === 'JSON' || watchedValueType === 'TEXT' ? 4 : 1}
          placeholder={
            watchedValueType === 'JSON'
              ? '{"key":"value"}'
              : watchedValueType === 'NUMBER'
                ? 'Ví dụ: 100000'
                : 'Nhập giá trị cấu hình'
          }
          helperText={
            watchedValueType === 'JSON'
              ? 'Giá trị phải là JSON hợp lệ.'
              : undefined
          }
          sx={{
            gridColumn: {
              xs: 'auto',
              md: '1 / -1',
            },
          }}
        />
      )}

      <HDropdown<SettingFormValues>
        name="status"
        label="Trạng thái"
        options={[
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Ngưng hoạt động', value: 'INACTIVE' },
        ]}
      />

      <HInput<SettingFormValues>
        name="description"
        label="Mô tả"
        multiline
        rows={3}
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