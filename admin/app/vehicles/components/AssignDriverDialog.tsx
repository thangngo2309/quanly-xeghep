'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { HFormDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';
import type { VehicleItem } from '@/api/vehicles.api';

export type DriverOption = {
  label: string;
  value: string;
};

export type AssignDriverFormValues = {
  driverId: string;
  date: string;
  note: string;
};

type AssignDriverDialogProps = {
  open: boolean;
  vehicle?: VehicleItem | null;
  loading?: boolean;
  initialDate: string;
  driverOptions?: DriverOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<AssignDriverFormValues>;
};

export function AssignDriverDialog({
  open,
  vehicle,
  loading,
  initialDate,
  driverOptions = [],
  onClose,
  onSubmit,
}: AssignDriverDialogProps) {
  const methods = useForm<AssignDriverFormValues>({
    defaultValues: {
      driverId: '',
      date: initialDate,
      note: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    methods.reset({
      driverId: vehicle?.assignmentOnDate?.driverId || '',
      date: vehicle?.assignmentOnDate?.date || initialDate,
      note: vehicle?.assignmentOnDate?.note || '',
    });
  }, [open, vehicle, initialDate, methods]);

  return (
    <HFormDialog<AssignDriverFormValues>
      open={open}
      mode="edit"
      title="Phân tài xế"
      description={
        vehicle
          ? `Phân tài xế lái xe ${vehicle.licensePlate} theo ngày.`
          : 'Phân tài xế lái xe theo ngày.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText="Lưu phân công"
      maxWidth="sm"
    >
      <HDatePicker<AssignDriverFormValues>
        name="date"
        label="Ngày chạy"
        rules={{
          required: 'Vui lòng chọn ngày chạy',
        }}
      />

      <HDropdown<AssignDriverFormValues>
        name="driverId"
        label="Tài xế"
        placeholder="Chọn tài xế"
        options={driverOptions}
        disabled={driverOptions.length === 0}
        helperText={
          driverOptions.length === 0
            ? 'Chưa có tài xế hoạt động thuộc nhà xe này'
            : undefined
        }
        rules={{
          required: 'Vui lòng chọn tài xế',
        }}
      />

      <HInput<AssignDriverFormValues>
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