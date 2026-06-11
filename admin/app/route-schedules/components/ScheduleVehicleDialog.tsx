'use client';

import { useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type {
  RouteScheduleStatus,
  RouteScheduleTemplateItem,
} from '@/api/route-schedules.api';
import type { RouteDirection } from '@/api/route-lines.api';
import { HFormDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';
import type { SelectOption } from './RouteScheduleFormDialog';

export type ScheduleVehicleFormValues = {
  vehicleId: string;
  driverId: string;
  startDirection: RouteDirection;
  firstDepartureTime: string;
  activeFrom: string;
  activeTo: string;
  status: RouteScheduleStatus;
  note: string;
};

type ScheduleVehicleDialogProps = {
  open: boolean;
  schedule?: RouteScheduleTemplateItem | null;
  loading?: boolean;
  initialDate: string;
  vehicleOptions?: SelectOption[];
  driverOptions?: SelectOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<ScheduleVehicleFormValues>;
};

export function ScheduleVehicleDialog({
  open,
  schedule,
  loading,
  initialDate,
  vehicleOptions = [],
  driverOptions = [],
  onClose,
  onSubmit,
}: ScheduleVehicleDialogProps) {
  const methods = useForm<ScheduleVehicleFormValues>({
    defaultValues: {
      vehicleId: '',
      driverId: '',
      startDirection: 'OUTBOUND',
      firstDepartureTime: '05:00',
      activeFrom: initialDate,
      activeTo: '',
      status: 'ACTIVE',
      note: '',
    },
  });

  const filteredVehicleOptions = useMemo(() => {
    if (!schedule) return [];

    return vehicleOptions.filter(
      (option) => option.companyId === schedule.companyId,
    );
  }, [schedule, vehicleOptions]);

  const filteredDriverOptions = useMemo(() => {
    if (!schedule) return [];

    return driverOptions.filter(
      (option) => option.companyId === schedule.companyId,
    );
  }, [driverOptions, schedule]);

  useEffect(() => {
    if (!open) return;

    methods.reset({
      vehicleId: '',
      driverId: '',
      startDirection: 'OUTBOUND',
      firstDepartureTime: schedule?.startTime || '05:00',
      activeFrom: initialDate,
      activeTo: '',
      status: 'ACTIVE',
      note: '',
    });
  }, [open, schedule, initialDate, methods]);

  return (
    <HFormDialog<ScheduleVehicleFormValues>
      open={open}
      mode="add"
      title="Thêm xe vào vòng quay"
      description={
        schedule
          ? `Thêm xe tham gia lịch chạy: ${schedule.name}`
          : 'Thêm xe vào lịch chạy tuyến.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText="Thêm xe"
      maxWidth="sm"
    >
      <HDropdown<ScheduleVehicleFormValues>
        name="vehicleId"
        label="Xe"
        placeholder="Chọn xe"
        options={filteredVehicleOptions}
        disabled={filteredVehicleOptions.length === 0}
        helperText={
          filteredVehicleOptions.length === 0
            ? 'Chưa có xe hoạt động thuộc nhà xe này'
            : undefined
        }
        rules={{
          required: 'Vui lòng chọn xe',
        }}
      />

      <HDropdown<ScheduleVehicleFormValues>
        name="driverId"
        label="Tài xế"
        placeholder="Chọn tài xế hoặc để trống"
        options={filteredDriverOptions}
        helperText="Có thể để trống nếu xe đã được phân tài xế theo ngày."
      />

      <HDropdown<ScheduleVehicleFormValues>
        name="startDirection"
        label="Chiều xuất phát ban đầu"
        options={[
          { label: 'Chiều đi', value: 'OUTBOUND' },
          { label: 'Chiều về', value: 'RETURN' },
        ]}
        rules={{
          required: 'Vui lòng chọn chiều xuất phát',
        }}
      />

      <HInput<ScheduleVehicleFormValues>
        name="firstDepartureTime"
        label="Giờ xuất phát đầu tiên"
        type="time"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        rules={{
          required: 'Vui lòng nhập giờ xuất phát đầu tiên',
        }}
      />

      <HDatePicker<ScheduleVehicleFormValues>
        name="activeFrom"
        label="Áp dụng từ ngày"
        rules={{
          required: 'Vui lòng chọn ngày bắt đầu',
        }}
      />

      <HDatePicker<ScheduleVehicleFormValues>
        name="activeTo"
        label="Áp dụng đến ngày"
      />

      <HDropdown<ScheduleVehicleFormValues>
        name="status"
        label="Trạng thái"
        options={[
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Ngưng hoạt động', value: 'INACTIVE' },
        ]}
      />

      <HInput<ScheduleVehicleFormValues>
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