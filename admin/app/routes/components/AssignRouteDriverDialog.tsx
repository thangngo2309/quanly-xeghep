'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { TransportRouteItem } from '@/api/routes.api';
import { HFormDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';

export type DriverOption = {
  label: string;
  value: string;
};

export type AssignRouteDriverFormValues = {
  driverId: string;
  startedAt: string;
  note: string;
};

type AssignRouteDriverDialogProps = {
  open: boolean;
  route?: TransportRouteItem | null;
  loading?: boolean;
  initialDate: string;
  driverOptions?: DriverOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<AssignRouteDriverFormValues>;
};

export function AssignRouteDriverDialog({
  open,
  route,
  loading,
  initialDate,
  driverOptions = [],
  onClose,
  onSubmit,
}: AssignRouteDriverDialogProps) {
  const methods = useForm<AssignRouteDriverFormValues>({
    defaultValues: {
      driverId: '',
      startedAt: initialDate,
      note: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    methods.reset({
      driverId: '',
      startedAt: initialDate,
      note: '',
    });
  }, [open, initialDate, methods]);

  return (
    <HFormDialog<AssignRouteDriverFormValues>
      open={open}
      mode="edit"
      title="Phân tài xế vào tuyến"
      description={
        route
          ? `Phân tài xế khai thác tuyến ${route.name}. Nếu tài xế đang chạy tuyến khác, hệ thống sẽ chuyển tài xế sang tuyến này.`
          : 'Phân tài xế khai thác tuyến.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText="Lưu phân công"
      maxWidth="sm"
    >
      <HDropdown<AssignRouteDriverFormValues>
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

      <HDatePicker<AssignRouteDriverFormValues>
        name="startedAt"
        label="Ngày bắt đầu"
        rules={{
          required: 'Vui lòng chọn ngày bắt đầu',
        }}
      />

      <HInput<AssignRouteDriverFormValues>
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