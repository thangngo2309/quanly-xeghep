'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { RouteScheduleTemplateItem } from '@/api/route-schedules.api';
import { HFormDialog } from '@/components/dialog';
import { HDatePicker } from '@/components/form';

export type GenerateTripsFormValues = {
  fromDate: string;
  toDate: string;
};

type GenerateTripsDialogProps = {
  open: boolean;
  schedule?: RouteScheduleTemplateItem | null;
  loading?: boolean;
  initialDate: string;
  onClose: () => void;
  onSubmit: SubmitHandler<GenerateTripsFormValues>;
};

export function GenerateTripsDialog({
  open,
  schedule,
  loading,
  initialDate,
  onClose,
  onSubmit,
}: GenerateTripsDialogProps) {
  const methods = useForm<GenerateTripsFormValues>({
    defaultValues: {
      fromDate: initialDate,
      toDate: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    methods.reset({
      fromDate: initialDate,
      toDate: '',
    });
  }, [open, initialDate, methods]);

  return (
    <HFormDialog<GenerateTripsFormValues>
      open={open}
      mode="add"
      title="Sinh chuyến tự động"
      description={
        schedule
          ? `Sinh chuyến xe từ lịch: ${schedule.name}`
          : 'Sinh chuyến xe từ lịch chạy tuyến.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText="Sinh chuyến"
      maxWidth="sm"
    >
      <HDatePicker<GenerateTripsFormValues>
        name="fromDate"
        label="Từ ngày"
        rules={{
          required: 'Vui lòng chọn ngày bắt đầu',
        }}
      />

      <HDatePicker<GenerateTripsFormValues>
        name="toDate"
        label="Đến ngày"
        helperText="Để trống thì hệ thống dùng số ngày sinh trước trong lịch."
      />
    </HFormDialog>
  );
}