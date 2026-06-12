"use client";

import {
  Autocomplete,
  TextField,
  type AutocompleteChangeReason,
  type AutocompleteInputChangeReason,
  type AutocompleteProps,
  type SxProps,
  type TextFieldProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from "react-hook-form";

export type HAutocompleteOption<TValue extends string | number = string> = {
  label: string;
  value: TValue;
  disabled?: boolean;
  description?: string;
  [key: string]: unknown;
};

type HAutoCompleteOption<TValue extends string | number = string> =
  HAutocompleteOption<TValue>;

type MuiAutocompleteProps<TValue extends string | number> = Omit<
  AutocompleteProps<HAutoCompleteOption<TValue>, false, boolean, false>,
  | "renderInput"
  | "options"
  | "value"
  | "onChange"
  | "inputValue"
  | "onInputChange"
  | "loading"
  | "disabled"
  | "fullWidth"
  | "clearOnBlur"
  | "disableClearable"
>;

type HAutocompleteTextFieldProps = Omit<
  TextFieldProps,
  | "name"
  | "value"
  | "onChange"
  | "error"
  | "helperText"
  | "required"
  | "fullWidth"
  | "label"
  | "placeholder"
>;

type HAutocompleteProps<
  T extends FieldValues,
  TValue extends string | number = string
> = {
  name: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  options: HAutocompleteOption<TValue>[];

  rules?: RegisterOptions<T, Path<T>>;
  helperText?: ReactNode;

  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;

  clearOnBlur?: boolean;
  disableClearable?: boolean;

  sx?: SxProps<Theme>;
  textFieldProps?: HAutocompleteTextFieldProps;
  autocompleteProps?: MuiAutocompleteProps<TValue>;

  onOptionChange?: (
    option: HAutocompleteOption<TValue> | null,
    reason: AutocompleteChangeReason
  ) => void;

  inputValue?: string;
  onInputValueChange?: (
    value: string,
    reason: AutocompleteInputChangeReason
  ) => void;
};

function isRequiredRule(required: unknown) {
  if (!required) return false;

  if (typeof required === "object" && "value" in required) {
    return Boolean((required as { value?: unknown }).value);
  }

  return true;
}

function findOptionByValue<TValue extends string | number>(
  options: HAutocompleteOption<TValue>[],
  value: unknown
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    options.find((option) => String(option.value) === String(value)) || null
  );
}

export function HAutocomplete<
  T extends FieldValues,
  TValue extends string | number = string
>({
  name,
  label,
  placeholder,
  options,

  rules,
  helperText,

  fullWidth = true,
  required,
  disabled,
  loading = false,

  clearOnBlur = false,
  disableClearable = false,

  sx,
  textFieldProps,
  autocompleteProps,

  onOptionChange,

  inputValue,
  onInputValueChange,
}: HAutocompleteProps<T, TValue>) {
  const { control } = useFormContext<T>();
  const isRequired = required || isRequiredRule(rules?.required);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const selectedOption = findOptionByValue(options, field.value);

        return (
          <Autocomplete<HAutoCompleteOption<TValue>, false, boolean, false>
            {...autocompleteProps}
            options={options}
            value={selectedOption}
            disabled={disabled}
            loading={loading}
            clearOnBlur={clearOnBlur}
            disableClearable={disableClearable}
            fullWidth={fullWidth}
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.value) === String(value.value)
            }
            getOptionDisabled={(option) => Boolean(option.disabled)}
            inputValue={inputValue}
            onInputChange={(_, value, reason) => {
              onInputValueChange?.(value, reason);
            }}
            onChange={(_, option, reason) => {
              field.onChange(option?.value ?? "");
              onOptionChange?.(option, reason);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                {...textFieldProps}
                size={textFieldProps?.size || "small"}
                label={label}
                placeholder={placeholder}
                fullWidth={fullWidth}
                required={isRequired}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || helperText}
                sx={[
                  {
                    "& .MuiInputBase-root": {
                      minHeight: 44,
                      height: 44,
                      borderRadius: 2,
                    },
                    "& .MuiOutlinedInput-root": {
                      py: "0 !important",
                    },
                    "& .MuiOutlinedInput-input": {
                      py: "0 !important",
                      height: 44,
                      boxSizing: "border-box",
                    },
                    "& .MuiAutocomplete-endAdornment": {
                      top: "50%",
                      transform: "translateY(-50%)",
                    },
                  },
                  ...(Array.isArray(sx) ? sx : [sx]),
                ]}
              />
            )}
          />
        );
      }}
    />
  );
}
