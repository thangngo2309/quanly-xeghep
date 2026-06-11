'use client';

import { useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import {
  getAvailableBookingTimesApi,
  type BookingItem,
  type BookingStatus,
} from '@/api/bookings.api';
import type { RouteDirection } from '@/api/route-lines.api';
import type { UserRole } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';
import { HDatePicker, HDropdown, HInput } from '@/components/form';

export type SelectOption = {
  label: string;
  value: string;
  companyId?: string;
};

export type BookingFormValues = {
  companyId: string;

  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  preferredTime: string;

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
  routeLineOptions?: SelectOption[];
  onClose: () => void;
  onSubmit: SubmitHandler<BookingFormValues>;
};

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toVietnamDate(value?: string | null) {
  if (!value) return getTodayDateString();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return getTodayDateString();

  const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return vietnamDate.toISOString().slice(0, 10);
}

function toVietnamTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return vietnamDate.toISOString().slice(11, 16);
}

const defaultValues: BookingFormValues = {
  companyId: '',
  routeLineId: '',
  direction: 'OUTBOUND',
  travelDate: getTodayDateString(),
  preferredTime: '',

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
  routeLineOptions = [],
  onClose,
  onSubmit,
}: BookingFormDialogProps) {
  const methods = useForm<BookingFormValues>({
    defaultValues,
  });

  const [timeOptions, setTimeOptions] = useState<SelectOption[]>([]);
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeHelperText, setTimeHelperText] = useState<string | undefined>();

  const isSystemAdmin = currentRole === 'SUPER_ADMIN';
  const isEditMode = mode === 'edit';

  const watchedCompanyId = methods.watch('companyId');
  const watchedRouteLineId = methods.watch('routeLineId');
  const watchedDirection = methods.watch('direction');
  const watchedTravelDate = methods.watch('travelDate');
  const watchedPassengerCount = methods.watch('passengerCount');

  const filteredRouteLineOptions = useMemo(() => {
    if (!isSystemAdmin) return routeLineOptions;
    if (!watchedCompanyId) return [];

    return routeLineOptions.filter(
      (option) => option.companyId === watchedCompanyId,
    );
  }, [isSystemAdmin, routeLineOptions, watchedCompanyId]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        companyId: initialValues.companyId || '',
        routeLineId: initialValues.trip?.routeLineId || '',
        direction: (initialValues.trip?.direction || 'OUTBOUND') as RouteDirection,
        travelDate: toVietnamDate(initialValues.trip?.departureTime),
        preferredTime: toVietnamTime(initialValues.trip?.departureTime),

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

      setTimeOptions([
        {
          label: toVietnamTime(initialValues.trip?.departureTime) || 'Giờ hiện tại',
          value: toVietnamTime(initialValues.trip?.departureTime),
        },
      ]);

      return;
    }

    methods.reset(defaultValues);
    setTimeOptions([]);
    setTimeHelperText(undefined);
  }, [open, mode, initialValues, methods]);

  useEffect(() => {
    if (!open || isEditMode) return;

    const routeLineId = methods.getValues('routeLineId');

    if (
      routeLineId &&
      !filteredRouteLineOptions.some((option) => option.value === routeLineId)
    ) {
      methods.setValue('routeLineId', '');
      methods.setValue('preferredTime', '');
      setTimeOptions([]);
    }
  }, [
    open,
    isEditMode,
    watchedCompanyId,
    filteredRouteLineOptions,
    methods,
  ]);

  useEffect(() => {
    if (!open || isEditMode) return;

    const routeLineId = watchedRouteLineId;
    const direction = watchedDirection;
    const travelDate = watchedTravelDate;
    const passengerCount = Number(watchedPassengerCount || 1);

    methods.setValue('preferredTime', '');
    setTimeOptions([]);

    if (!routeLineId || !direction || !travelDate) {
      setTimeHelperText('Chọn tuyến, chiều và ngày đi để tải giờ còn chỗ.');
      return;
    }

    let cancelled = false;

    async function loadTimes() {
      setTimeLoading(true);
      setTimeHelperText(undefined);

      try {
        const data = await getAvailableBookingTimesApi({
          routeLineId,
          direction,
          travelDate,
          passengerCount,
        });

        if (cancelled) return;

        const options = data.items.map((item) => ({
          label: item.label,
          value: item.time,
        }));

        setTimeOptions(options);

        if (options.length === 0) {
          setTimeHelperText('Không có chuyến còn ghế trong ngày đã chọn.');
        }
      } catch {
        if (cancelled) return;

        setTimeOptions([]);
        setTimeHelperText('Không tải được giờ còn chỗ.');
      } finally {
        if (!cancelled) {
          setTimeLoading(false);
        }
      }
    }

    loadTimes();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    isEditMode,
    watchedRouteLineId,
    watchedDirection,
    watchedTravelDate,
    watchedPassengerCount,
    methods,
  ]);

  return (
    <HFormDialog<BookingFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm booking' : 'Cập nhật booking'}
      description={
        mode === 'add'
          ? 'Chọn tuyến, ngày và giờ đi. Hệ thống tự tìm chuyến phù hợp còn ghế.'
          : 'Cập nhật thông tin khách và trạng thái booking.'
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
          disabled={isEditMode || companyOptions.length === 0}
          rules={{
            required: mode === 'add' ? 'Vui lòng chọn nhà xe' : false,
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
        name="routeLineId"
        label="Tuyến khai thác"
        placeholder="Chọn tuyến khai thác"
        options={filteredRouteLineOptions}
        disabled={isEditMode || filteredRouteLineOptions.length === 0}
        helperText={
          isSystemAdmin && !watchedCompanyId
            ? 'Vui lòng chọn nhà xe trước'
            : undefined
        }
        rules={{
          required: mode === 'add' ? 'Vui lòng chọn tuyến khai thác' : false,
        }}
      />

      <HDropdown<BookingFormValues>
        name="direction"
        label="Chiều đi"
        disabled={isEditMode}
        options={[
          {
            label: 'Chiều đi',
            value: 'OUTBOUND',
          },
          {
            label: 'Chiều về',
            value: 'RETURN',
          },
        ]}
        rules={{
          required: mode === 'add' ? 'Vui lòng chọn chiều đi' : false,
        }}
      />

      <HDatePicker<BookingFormValues>
        name="travelDate"
        label="Ngày đi"
        disabled={isEditMode}
        rules={{
          required: mode === 'add' ? 'Vui lòng chọn ngày đi' : false,
        }}
      />

      <HDropdown<BookingFormValues>
        name="preferredTime"
        label="Giờ đi"
        placeholder={timeLoading ? 'Đang tải giờ...' : 'Chọn giờ đi'}
        options={timeOptions}
        disabled={isEditMode || timeLoading || timeOptions.length === 0}
        helperText={timeHelperText}
        rules={{
          required: mode === 'add' ? 'Vui lòng chọn giờ đi' : false,
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
          { label: 'Chờ xác nhận', value: 'PENDING' },
          { label: 'Đã xác nhận', value: 'CONFIRMED' },
          { label: 'Đã đón khách', value: 'PICKED_UP' },
          { label: 'Hoàn thành', value: 'COMPLETED' },
          { label: 'Đã hủy', value: 'CANCELED' },
          { label: 'Khách không đi', value: 'NO_SHOW' },
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