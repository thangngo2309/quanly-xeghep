'use client';

import { TextField, type TextFieldProps } from '@mui/material';
import {
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
  useFormContext,
} from 'react-hook-form';

type HInputProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'value' | 'defaultValue' | 'error'
> & {
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
};

export function HInput<T extends FieldValues>({
  name,
  rules,
  helperText,
  fullWidth = true,
  ...props
}: HInputProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          value={field.value ?? ''}
          fullWidth={fullWidth}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || helperText}
        />
      )}
    />
  );
}