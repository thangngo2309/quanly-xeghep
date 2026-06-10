'use client';

import { useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import type { BookingItem, BookingStatus } from '@/api/bookings.api';
import type { UserRole } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type SelectOption = {
  label: string;
  value: string;
  companyId?: string;
  routeId?: string;
  driverId?: string;
};

export type BookingFormValues = {
  companyId: string;
  tripId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  passengerCount: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupNote: string;
  dropoffNote: string;
  seatPrice: string;
  status: BookingStatus;
  note: string;
};

type BookingFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: BookingItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: SelectOption[];
  tripOptions?: SelectOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<BookingFormValues>;
};

const defaultValues: BookingFormValues = {
  companyId: '',
  tripId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  passengerCount: '1',
  pickupAddress: '',
  dropoffAddress: '',
  pickupNote: '',
  dropoffNote: '',
  seatPrice: '',
  status: 'CONFIRMED',
  note: '',
};

export function BookingFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  tripOptions = [],
  onClose,
  onSubmit,
}: BookingFormDialogProps) {
  const methods = useForm<BookingFormValues>({
    defaultValues,
  });

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';
  const watchedCompanyId = methods.watch('companyId');

  const filteredTripOptions = useMemo(() => {
    if (!isSystemAdmin) return tripOptions;
    if (!watchedCompanyId) return [];

    return tripOptions.filter((option) => option.companyId === watchedCompanyId);
  }, [isSystemAdmin, tripOptions, watchedCompanyId]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        tripId: initialValues.tripId || '',
        customerName: initialValues.customerName || '',
        customerPhone: initialValues.customerPhone || '',
        customerEmail: initialValues.customerEmail || '',
        passengerCount: initialValues.passengerCount
          ? String(initialValues.passengerCount)
          : '1',
        pickupAddress: initialValues.pickupAddress || '',
        dropoffAddress: initialValues.dropoffAddress || '',
        pickupNote: initialValues.pickupNote || '',
        dropoffNote: initialValues.dropoffNote || '',
        seatPrice:
          initialValues.seatPrice !== null &&
          initialValues.seatPrice !== undefined
            ? String(initialValues.seatPrice)
            : '',
        status: initialValues.status || 'CONFIRMED',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  useEffect(() => {
    if (!open || !isSystemAdmin) return;

    const tripId = methods.getValues('tripId');

    if (
      tripId &&
      !filteredTripOptions.some((option) => option.value === tripId)
    ) {
      methods.setValue('tripId', '');
    }
  }, [open, isSystemAdmin, watchedCompanyId, filteredTripOptions, methods]);

  return (
    <HFormDialog<BookingFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm booking' : 'Cập nhật booking'}
      description={
        mode === 'add'
          ? 'Tạo booking mới cho chuyến xe.'
          : 'Cập nhật thông tin booking và trạng thái giữ chỗ.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo booking' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      {isSystemAdmin && (
        <HDropdown<BookingFormValues>
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

      <HDropdown<BookingFormValues>
        name="tripId"
        label="Chuyến xe"
        placeholder="Chọn chuyến xe"
        options={filteredTripOptions}
        disabled={filteredTripOptions.length === 0}
        helperText={
          isSystemAdmin && !watchedCompanyId
            ? 'Vui lòng chọn nhà xe trước'
            : filteredTripOptions.length === 0
              ? 'Chưa có chuyến xe phù hợp'
              : undefined
        }
        rules={{
          required: 'Vui lòng chọn chuyến xe',
        }}
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<BookingFormValues>
        name="customerName"
        label="Tên khách hàng"
        rules={{
          required: 'Vui lòng nhập tên khách hàng',
        }}
      />

      <HInput<BookingFormValues>
        name="customerPhone"
        label="Số điện thoại"
        rules={{
          required: 'Vui lòng nhập số điện thoại',
        }}
      />

      <HInput<BookingFormValues>
        name="customerEmail"
        label="Email"
        type="email"
      />

      <HInput<BookingFormValues>
        name="passengerCount"
        label="Số khách"
        type="number"
        rules={{
          required: 'Vui lòng nhập số khách',
          min: {
            value: 1,
            message: 'Số khách tối thiểu là 1',
          },
        }}
      />

      <HInput<BookingFormValues>
        name="seatPrice"
        label="Giá mỗi ghế"
        type="number"
        helperText="Để trống thì lấy theo giá vé của chuyến."
      />

      <HDropdown<BookingFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: 'Chờ xác nhận',
            value: 'PENDING',
          },
          {
            label: 'Đã xác nhận',
            value: 'CONFIRMED',
          },
          {
            label: 'Đã đón khách',
            value: 'PICKED_UP',
          },
          {
            label: 'Hoàn thành',
            value: 'COMPLETED',
          },
          {
            label: 'Đã hủy',
            value: 'CANCELED',
          },
          {
            label: 'Khách không đi',
            value: 'NO_SHOW',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn trạng thái',
        }}
      />

      <HInput<BookingFormValues>
        name="pickupAddress"
        label="Địa chỉ đón"
        multiline
        rows={2}
      />

      <HInput<BookingFormValues>
        name="dropoffAddress"
        label="Địa chỉ trả"
        multiline
        rows={2}
      />

      <HInput<BookingFormValues>
        name="pickupNote"
        label="Ghi chú điểm đón"
        multiline
        rows={2}
      />

      <HInput<BookingFormValues>
        name="dropoffNote"
        label="Ghi chú điểm trả"
        multiline
        rows={2}
      />

      <HInput<BookingFormValues>
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