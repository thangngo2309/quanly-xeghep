'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type {
  VehicleItem,
  VehicleStatus,
  VehicleType,
} from '@/api/vehicles.api';
import { HFormDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';
import type { UserRole } from '@/api/users.api';

export type VehicleFormValues = {
  companyId: string;
  licensePlate: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  color: string;
  productionYear: string;
  registrationExpiryDate: string;
  status: VehicleStatus;
  note: string;
};

export type CompanyOption = {
  label: string;
  value: string;
};

type VehicleFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: VehicleItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: CompanyOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<VehicleFormValues>;
};

const defaultValues: VehicleFormValues = {
  companyId: '',
  licensePlate: '',
  vehicleType: 'SEVEN_SEAT',
  brand: '',
  model: '',
  color: '',
  productionYear: '',
  registrationExpiryDate: '',
  status: 'ACTIVE',
  note: '',
};

export function VehicleFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  onClose,
  onSubmit,
}: VehicleFormDialogProps) {
  const methods = useForm<VehicleFormValues>({
    defaultValues,
  });

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        licensePlate: initialValues.licensePlate || '',
        vehicleType: initialValues.vehicleType || 'SEVEN_SEAT',
        brand: initialValues.brand || '',
        model: initialValues.model || '',
        color: initialValues.color || '',
        productionYear: initialValues.productionYear
          ? String(initialValues.productionYear)
          : '',
        registrationExpiryDate: initialValues.registrationExpiryDate || '',
        status: initialValues.status || 'ACTIVE',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<VehicleFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm xe' : 'Cập nhật xe'}
      description={
        mode === 'add'
          ? 'Tạo thông tin xe mới cho nhà xe.'
          : 'Cập nhật thông tin xe.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo xe' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<VehicleFormValues>
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

      <HInput<VehicleFormValues>
        name="licensePlate"
        label="Biển số xe"
        placeholder="Ví dụ: 43A-12345"
        rules={{
          required: 'Vui lòng nhập biển số xe',
        }}
      />

      <HDropdown<VehicleFormValues>
        name="vehicleType"
        label="Loại xe"
        options={[
          {
            label: 'Xe 5 chỗ',
            value: 'FIVE_SEAT',
          },
          {
            label: 'Xe 7 chỗ',
            value: 'SEVEN_SEAT',
          },
          {
            label: 'Limousine 10 chỗ',
            value: 'LIMOUSINE_10',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn loại xe',
        }}
      />

      <HInput<VehicleFormValues>
        name="brand"
        label="Hãng xe"
        placeholder="Toyota, Ford..."
      />

      <HInput<VehicleFormValues>
        name="model"
        label="Dòng xe"
        placeholder="Innova, Transit..."
      />

      <HInput<VehicleFormValues>
        name="color"
        label="Màu xe"
      />

      <HInput<VehicleFormValues>
        name="productionYear"
        label="Năm sản xuất"
        type="number"
      />

      <HDatePicker<VehicleFormValues>
        name="registrationExpiryDate"
        label="Hạn đăng kiểm"
      />

      <HDropdown<VehicleFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: 'Hoạt động',
            value: 'ACTIVE',
          },
          {
            label: 'Bảo trì',
            value: 'MAINTENANCE',
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

      <HInput<VehicleFormValues>
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