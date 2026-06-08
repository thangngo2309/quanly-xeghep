'use client';

import {
  MenuItem,
  TextField,
  type TextFieldProps,
} from '@mui/material';
import {
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
  useFormContext,
} from 'react-hook-form';

export type HDropdownOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type HDropdownProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'value' | 'defaultValue' | 'error' | 'select'
> & {
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
  options: HDropdownOption[];
  placeholder?: string;
};

export function HDropdown<T extends FieldValues>({
  name,
  rules,
  options,
  placeholder = 'Chọn',
  helperText,
  fullWidth = true,
  ...props
}: HDropdownProps<T>) {
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
          select
          value={field.value ?? ''}
          fullWidth={fullWidth}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || helperText}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )}

          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}