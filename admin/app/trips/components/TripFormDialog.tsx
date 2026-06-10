'use client';

import { useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { TripItem, TripStatus } from '@/api/trips.api';
import type { UserRole } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type SelectOption = {
  label: string;
  value: string;
  companyId?: string;
};

export type TripFormValues = {
  companyId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  departureTime: string;
  expectedArrivalTime: string;
  totalSeats: string;
  basePrice: string;
  status: TripStatus;
  pickupNote: string;
  dropoffNote: string;
  note: string;
};

type TripFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: TripItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: SelectOption[];
  routeOptions?: SelectOption[];
  vehicleOptions?: SelectOption[];
  driverOptions?: SelectOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<TripFormValues>;
};

const defaultValues: TripFormValues = {
  companyId: '',
  routeId: '',
  vehicleId: '',
  driverId: '',
  departureTime: '',
  expectedArrivalTime: '',
  totalSeats: '',
  basePrice: '',
  status: 'SCHEDULED',
  pickupNote: '',
  dropoffNote: '',
  note: '',
};

function toDateTimeLocalString(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 16);
}

export function TripFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  routeOptions = [],
  vehicleOptions = [],
  driverOptions = [],
  onClose,
  onSubmit,
}: TripFormDialogProps) {
  const methods = useForm<TripFormValues>({
    defaultValues,
  });

  const watchedCompanyId = methods.watch('companyId');
  const isSystemAdmin = currentRole === 'SUPER_ADMIN';

  const filteredRouteOptions = useMemo(() => {
    if (!isSystemAdmin) return routeOptions;
    if (!watchedCompanyId) return [];

    return routeOptions.filter((option) => option.companyId === watchedCompanyId);
  }, [isSystemAdmin, routeOptions, watchedCompanyId]);

  const filteredVehicleOptions = useMemo(() => {
    if (!isSystemAdmin) return vehicleOptions;
    if (!watchedCompanyId) return [];

    return vehicleOptions.filter(
      (option) => option.companyId === watchedCompanyId,
    );
  }, [isSystemAdmin, vehicleOptions, watchedCompanyId]);

  const filteredDriverOptions = useMemo(() => {
    if (!isSystemAdmin) return driverOptions;
    if (!watchedCompanyId) return [];

    return driverOptions.filter((option) => option.companyId === watchedCompanyId);
  }, [driverOptions, isSystemAdmin, watchedCompanyId]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        routeId: initialValues.routeId || '',
        vehicleId: initialValues.vehicleId || '',
        driverId: initialValues.driverId || '',
        departureTime: toDateTimeLocalString(initialValues.departureTime),
        expectedArrivalTime: toDateTimeLocalString(
          initialValues.expectedArrivalTime,
        ),
        totalSeats: initialValues.totalSeats ? String(initialValues.totalSeats) : '',
        basePrice:
          initialValues.basePrice !== null && initialValues.basePrice !== undefined
            ? String(initialValues.basePrice)
            : '',
        status: initialValues.status || 'SCHEDULED',
        pickupNote: initialValues.pickupNote || '',
        dropoffNote: initialValues.dropoffNote || '',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  useEffect(() => {
    if (!open || !isSystemAdmin) return;

    const routeId = methods.getValues('routeId');
    const vehicleId = methods.getValues('vehicleId');
    const driverId = methods.getValues('driverId');

    if (
      routeId &&
      !filteredRouteOptions.some((option) => option.value === routeId)
    ) {
      methods.setValue('routeId', '');
    }

    if (
      vehicleId &&
      !filteredVehicleOptions.some((option) => option.value === vehicleId)
    ) {
      methods.setValue('vehicleId', '');
    }

    if (
      driverId &&
      !filteredDriverOptions.some((option) => option.value === driverId)
    ) {
      methods.setValue('driverId', '');
    }
  }, [
    open,
    isSystemAdmin,
    watchedCompanyId,
    filteredRouteOptions,
    filteredVehicleOptions,
    filteredDriverOptions,
    methods,
  ]);

  return (
    <HFormDialog<TripFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm chuyến xe' : 'Cập nhật chuyến xe'}
      description={
        mode === 'add'
          ? 'Tạo chuyến xe theo tuyến, xe, tài xế và thời gian khởi hành.'
          : 'Cập nhật thông tin chuyến xe.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo chuyến' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<TripFormValues>
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

      <HDropdown<TripFormValues>
        name="routeId"
        label="Tuyến đường"
        placeholder="Chọn tuyến đường"
        options={filteredRouteOptions}
        disabled={filteredRouteOptions.length === 0}
        helperText={
          isSystemAdmin && !watchedCompanyId
            ? 'Vui lòng chọn nhà xe trước'
            : filteredRouteOptions.length === 0
              ? 'Chưa có tuyến đường hoạt động'
              : undefined
        }
        rules={{
          required: 'Vui lòng chọn tuyến đường',
        }}
      />

      <HDropdown<TripFormValues>
        name="vehicleId"
        label="Xe"
        placeholder="Chọn xe"
        options={filteredVehicleOptions}
        disabled={filteredVehicleOptions.length === 0}
        helperText={
          isSystemAdmin && !watchedCompanyId
            ? 'Vui lòng chọn nhà xe trước'
            : filteredVehicleOptions.length === 0
              ? 'Chưa có xe hoạt động'
              : undefined
        }
        rules={{
          required: 'Vui lòng chọn xe',
        }}
      />

      <HDropdown<TripFormValues>
        name="driverId"
        label="Tài xế"
        placeholder="Tự lấy theo xe hoặc chọn tài xế"
        options={filteredDriverOptions}
        disabled={filteredDriverOptions.length === 0}
        helperText="Có thể để trống nếu xe đã được phân tài xế theo ngày khởi hành."
      />

      <HDropdown<TripFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: 'Đã lên lịch',
            value: 'SCHEDULED',
          },
          {
            label: 'Mở nhận khách',
            value: 'OPEN',
          },
          {
            label: 'Đang chạy',
            value: 'RUNNING',
          },
          {
            label: 'Hoàn thành',
            value: 'COMPLETED',
          },
          {
            label: 'Đã hủy',
            value: 'CANCELED',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn trạng thái',
        }}
      />

      <HInput<TripFormValues>
        name="departureTime"
        label="Thời gian khởi hành"
        type="datetime-local"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        rules={{
          required: 'Vui lòng chọn thời gian khởi hành',
        }}
      />

      <HInput<TripFormValues>
        name="expectedArrivalTime"
        label="Thời gian đến dự kiến"
        type="datetime-local"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
      />

      <HInput<TripFormValues>
        name="totalSeats"
        label="Số ghế mở bán"
        type="number"
        helperText="Để trống thì hệ thống lấy theo số ghế của xe."
      />

      <HInput<TripFormValues>
        name="basePrice"
        label="Giá vé cơ bản"
        type="number"
        helperText="Đơn vị VNĐ"
      />

      <HInput<TripFormValues>
        name="pickupNote"
        label="Ghi chú điểm đón"
        multiline
        rows={2}
      />

      <HInput<TripFormValues>
        name="dropoffNote"
        label="Ghi chú điểm trả"
        multiline
        rows={2}
      />

      <HInput<TripFormValues>
        name="note"
        label="Ghi chú nội bộ"
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