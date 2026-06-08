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

function isRequiredRule(required: unknown) {
  if (!required) return false;

  if (typeof required === 'object' && 'value' in required) {
    return Boolean((required as { value?: unknown }).value);
  }

  return true;
}

export function HInput<T extends FieldValues>({
  name,
  rules,
  helperText,
  fullWidth = true,
  size = 'small',
  required,
  ...props
}: HInputProps<T>) {
  const { control } = useFormContext<T>();

  const isRequired = required || isRequiredRule(rules?.required);

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
          size={size}
          required={isRequired}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || helperText}
        />
      )}
    />
  );
}