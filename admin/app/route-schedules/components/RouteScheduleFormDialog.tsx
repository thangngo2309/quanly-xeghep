'use client';

import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type {
  RouteScheduleStatus,
  TripStatus,
} from '@/api/route-schedules.api';
import type { UserRole } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type SelectOption = {
  label: string;
  value: string;
  companyId?: string;
};

export type RouteScheduleFormValues = {
  companyId: string;
  routeLineId: string;
  name: string;
  startTime: string;
  endTime: string;
  headwayMinutes: string;
  outboundDurationMinutes: string;
  returnDurationMinutes: string;
  turnaroundAtEndMinutes: string;
  turnaroundAtStartMinutes: string;
  daysOfWeek: number[];
  generateDaysAhead: string;
  defaultBasePrice: string;
  defaultTripStatus: TripStatus;
  status: RouteScheduleStatus;
  note: string;
};

type RouteScheduleFormDialogProps = {
  open: boolean;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: SelectOption[];
  routeLineOptions?: SelectOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<RouteScheduleFormValues>;
};

const defaultValues: RouteScheduleFormValues = {
  companyId: '',
  routeLineId: '',
  name: '',
  startTime: '05:00',
  endTime: '20:00',
  headwayMinutes: '60',
  outboundDurationMinutes: '150',
  returnDurationMinutes: '150',
  turnaroundAtEndMinutes: '30',
  turnaroundAtStartMinutes: '30',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
  generateDaysAhead: '15',
  defaultBasePrice: '',
  defaultTripStatus: 'OPEN',
  status: 'ACTIVE',
  note: '',
};

const dayOptions = [
  { label: 'T2', value: 1 },
  { label: 'T3', value: 2 },
  { label: 'T4', value: 3 },
  { label: 'T5', value: 4 },
  { label: 'T6', value: 5 },
  { label: 'T7', value: 6 },
  { label: 'CN', value: 0 },
];

export function RouteScheduleFormDialog({
  open,
  loading,
  currentRole,
  companyOptions = [],
  routeLineOptions = [],
  onClose,
  onSubmit,
}: RouteScheduleFormDialogProps) {
  const methods = useForm<RouteScheduleFormValues>({
    defaultValues,
  });

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';
  const watchedCompanyId = methods.watch('companyId');
  const watchedDays = methods.watch('daysOfWeek') || [];

  const filteredRouteLineOptions = useMemo(() => {
    if (!isSystemAdmin) return routeLineOptions;
    if (!watchedCompanyId) return [];

    return routeLineOptions.filter(
      (option) => option.companyId === watchedCompanyId,
    );
  }, [isSystemAdmin, routeLineOptions, watchedCompanyId]);

  useEffect(() => {
    if (!open) return;

    methods.reset(defaultValues);
  }, [open, methods]);

  useEffect(() => {
    if (!open || !isSystemAdmin) return;

    const routeLineId = methods.getValues('routeLineId');

    if (
      routeLineId &&
      !filteredRouteLineOptions.some((option) => option.value === routeLineId)
    ) {
      methods.setValue('routeLineId', '');
    }
  }, [open, isSystemAdmin, watchedCompanyId, filteredRouteLineOptions, methods]);

  function toggleDay(day: number) {
    const currentDays = methods.getValues('daysOfWeek') || [];

    if (currentDays.includes(day)) {
      methods.setValue(
        'daysOfWeek',
        currentDays.filter((item) => item !== day),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      return;
    }

    methods.setValue('daysOfWeek', [...currentDays, day], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <HFormDialog<RouteScheduleFormValues>
      open={open}
      mode="add"
      title="Thêm lịch chạy tuyến"
      description="Cấu hình khung giờ, tần suất và thời gian quay đầu để hệ thống tự sinh chuyến xe."
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText="Tạo lịch"
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<RouteScheduleFormValues>
          name="companyId"
          label="Nhà xe"
          placeholder="Chọn nhà xe"
          options={companyOptions}
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

      <HDropdown<RouteScheduleFormValues>
        name="routeLineId"
        label="Tuyến khai thác"
        placeholder="Chọn tuyến khai thác"
        options={filteredRouteLineOptions}
        disabled={filteredRouteLineOptions.length === 0}
        helperText={
          isSystemAdmin && !watchedCompanyId
            ? 'Vui lòng chọn nhà xe trước'
            : filteredRouteLineOptions.length === 0
              ? 'Chưa có tuyến khai thác hoạt động'
              : undefined
        }
        rules={{
          required: 'Vui lòng chọn tuyến khai thác',
        }}
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="name"
        label="Tên lịch"
        placeholder="Ví dụ: Lịch Đà Nẵng ⇄ Huế mỗi 60 phút"
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="startTime"
        label="Giờ bắt đầu"
        type="time"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        rules={{
          required: 'Vui lòng nhập giờ bắt đầu',
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="endTime"
        label="Giờ kết thúc"
        type="time"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        rules={{
          required: 'Vui lòng nhập giờ kết thúc',
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="headwayMinutes"
        label="Tần suất xuất bến"
        type="number"
        helperText="Đơn vị phút. Ví dụ: 60"
        rules={{
          required: 'Vui lòng nhập tần suất',
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="generateDaysAhead"
        label="Số ngày sinh trước"
        type="number"
        helperText="Ví dụ: 15 ngày"
      />

      <HInput<RouteScheduleFormValues>
        name="outboundDurationMinutes"
        label="Thời gian chiều đi"
        type="number"
        helperText="Đơn vị phút"
        rules={{
          required: 'Vui lòng nhập thời gian chiều đi',
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="returnDurationMinutes"
        label="Thời gian chiều về"
        type="number"
        helperText="Đơn vị phút"
        rules={{
          required: 'Vui lòng nhập thời gian chiều về',
        }}
      />

      <HInput<RouteScheduleFormValues>
        name="turnaroundAtEndMinutes"
        label="Quay đầu tại điểm cuối"
        type="number"
        helperText="Đơn vị phút"
      />

      <HInput<RouteScheduleFormValues>
        name="turnaroundAtStartMinutes"
        label="Quay đầu tại điểm đầu"
        type="number"
        helperText="Đơn vị phút"
      />

      <Box
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
          Ngày áp dụng
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {dayOptions.map((day) => (
            <FormControlLabel
              key={day.value}
              control={
                <Checkbox
                  checked={watchedDays.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                />
              }
              label={day.label}
            />
          ))}
        </Box>
      </Box>

      <HInput<RouteScheduleFormValues>
        name="defaultBasePrice"
        label="Giá vé mặc định"
        type="number"
        helperText="Đơn vị VNĐ"
      />

      <HDropdown<RouteScheduleFormValues>
        name="defaultTripStatus"
        label="Trạng thái chuyến sinh ra"
        options={[
          { label: 'Đã lên lịch', value: 'SCHEDULED' },
          { label: 'Mở nhận khách', value: 'OPEN' },
        ]}
      />

      <HDropdown<RouteScheduleFormValues>
        name="status"
        label="Trạng thái lịch"
        options={[
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Ngưng hoạt động', value: 'INACTIVE' },
        ]}
      />

      <HInput<RouteScheduleFormValues>
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