'use client';

import type { SxProps, TextFieldProps, Theme } from '@mui/material';
import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers';
import dayjs, { type Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from 'react-hook-form';

type DateValueFormat = 'dayjs' | 'date' | 'iso' | 'yyyy-MM-dd';

type HDatePickerTextFieldProps = Omit<
  TextFieldProps,
  | 'name'
  | 'value'
  | 'onChange'
  | 'error'
  | 'helperText'
  | 'required'
  | 'fullWidth'
>;

type PickerTextFieldSlot = NonNullable<
  NonNullable<DatePickerProps['slotProps']>['textField']
>;

type HDatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  label?: ReactNode;
  rules?: RegisterOptions<T, Path<T>>;
  helperText?: ReactNode;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  format?: string;
  valueFormat?: DateValueFormat;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disablePast?: boolean;
  disableFuture?: boolean;
  sx?: SxProps<Theme>;
  textFieldProps?: HDatePickerTextFieldProps;
};

function toDayjsValue(value: unknown): Dayjs | null {
  if (!value) return null;

  if (dayjs.isDayjs(value)) {
    return value;
  }

  if (value instanceof Date) {
    return dayjs(value);
  }

  if (typeof value === 'string') {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }

  return null;
}

function formatDateValue(value: Dayjs | null, format: DateValueFormat) {
  if (!value || !value.isValid()) return null;

  switch (format) {
    case 'dayjs':
      return value;

    case 'date':
      return value.toDate();

    case 'iso':
      return value.toISOString();

    case 'yyyy-MM-dd':
    default:
      return value.format('YYYY-MM-DD');
  }
}

function isRequiredRule(required: unknown) {
  if (!required) return false;

  if (typeof required === 'object' && 'value' in required) {
    return Boolean((required as { value?: unknown }).value);
  }

  return true;
}

export function HDatePicker<T extends FieldValues>({
  name,
  label,
  rules,
  helperText,
  fullWidth = true,
  required,
  disabled,
  format = 'DD/MM/YYYY',
  valueFormat = 'yyyy-MM-dd',
  minDate,
  maxDate,
  disablePast,
  disableFuture,
  sx,
  textFieldProps,
}: HDatePickerProps<T>) {
  const { control } = useFormContext<T>();
  const isRequired = required || isRequiredRule(rules?.required);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <DatePicker
          label={label}
          format={format}
          value={toDayjsValue(field.value)}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
          disableFuture={disableFuture}
          onChange={(date) => {
            field.onChange(formatDateValue(date, valueFormat));
          }}
          slotProps={{
            textField: {
              ...textFieldProps,
              sx,
              fullWidth,
              required: isRequired,
              error: !!fieldState.error,
              helperText: fieldState.error?.message || helperText,
            } as PickerTextFieldSlot,
          }}
        />
      )}
    />
  );
}