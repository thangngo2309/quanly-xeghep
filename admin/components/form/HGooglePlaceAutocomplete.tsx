'use client';

import {
  Autocomplete,
  TextField,
  type AutocompleteInputChangeReason,
  type SxProps,
  type TextFieldProps,
  type Theme,
} from '@mui/material';
import {
  useJsApiLoader,
  type Libraries,
} from '@react-google-maps/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from 'react-hook-form';

const GOOGLE_MAP_LIBRARIES: Libraries = ['places'];

export type GooglePlaceSelectedValue = {
  description: string;
  placeId: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
};

type GooglePlaceOption = {
  label: string;
  value: string;
  placeId: string;
  mainText?: string;
  secondaryText?: string;
};

type HGooglePlaceAutocompleteTextFieldProps = Omit<
  TextFieldProps,
  | 'name'
  | 'value'
  | 'onChange'
  | 'error'
  | 'helperText'
  | 'required'
  | 'fullWidth'
  | 'label'
  | 'placeholder'
>;

type HGooglePlaceAutocompleteProps<T extends FieldValues> = {
  name: Path<T>;
  label?: ReactNode;
  placeholder?: string;

  rules?: RegisterOptions<T, Path<T>>;
  helperText?: ReactNode;

  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;

  /**
   * Mặc định giới hạn Việt Nam.
   */
  country?: string | string[];

  /**
   * Mặc định tiếng Việt.
   */
  language?: string;
  region?: string;

  minLength?: number;
  debounceMs?: number;

  sx?: SxProps<Theme>;
  textFieldProps?: HGooglePlaceAutocompleteTextFieldProps;

  onPlaceSelected?: (place: GooglePlaceSelectedValue) => void;
};

function isRequiredRule(required: unknown) {
  if (!required) return false;

  if (typeof required === 'object' && 'value' in required) {
    return Boolean((required as { value?: unknown }).value);
  }

  return true;
}

function normalizePrediction(
  prediction: google.maps.places.AutocompletePrediction,
): GooglePlaceOption {
  return {
    label: prediction.description,
    value: prediction.description,
    placeId: prediction.place_id,
    mainText: prediction.structured_formatting?.main_text,
    secondaryText: prediction.structured_formatting?.secondary_text,
  };
}

export function HGooglePlaceAutocomplete<T extends FieldValues>({
  name,
  label,
  placeholder,

  rules,
  helperText,

  required,
  disabled,
  fullWidth = true,

  country = 'vn',
  language = 'vi',
  region = 'VN',

  minLength = 2,
  debounceMs = 350,

  sx,
  textFieldProps,

  onPlaceSelected,
}: HGooglePlaceAutocompleteProps<T>) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { control } = useFormContext<T>();

  const [options, setOptions] = useState<GooglePlaceOption[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);

  const placesServiceRef =
    useRef<google.maps.places.PlacesService | null>(null);

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
    language,
    region,
  });

  const isRequired = required || isRequiredRule(rules?.required);

  const componentRestrictions = useMemo(() => {
    if (!country) return undefined;

    return {
      country,
    };
  }, [country]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) {
      return;
    }

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();
    }

    if (!placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        div,
      );
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  const fetchPredictions = useCallback(
    (keyword: string) => {
      const service = autocompleteServiceRef.current;

      if (!service || keyword.trim().length < minLength) {
        setOptions([]);
        return;
      }

      setLoadingPredictions(true);

      service.getPlacePredictions(
        {
          input: keyword,
          componentRestrictions,
          sessionToken: sessionTokenRef.current || undefined,
        },
        (predictions, status) => {
          setLoadingPredictions(false);

          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            setOptions([]);
            return;
          }

          setOptions(predictions.map(normalizePrediction));
        },
      );
    },
    [componentRestrictions, minLength],
  );

  const fetchPlaceDetails = useCallback(
    (option: GooglePlaceOption) => {
      const service = placesServiceRef.current;

      if (!service) {
        onPlaceSelected?.({
          description: option.label,
          placeId: option.placeId,
        });

        return;
      }

      service.getDetails(
        {
          placeId: option.placeId,
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (place, status) => {
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !place
          ) {
            onPlaceSelected?.({
              description: option.label,
              placeId: option.placeId,
            });

            return;
          }

          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();

          onPlaceSelected?.({
            description: option.label,
            placeId: option.placeId,
            formattedAddress: place.formatted_address || option.label,
            lat,
            lng,
          });

          sessionTokenRef.current =
            new window.google.maps.places.AutocompleteSessionToken();
        },
      );
    },
    [onPlaceSelected],
  );

  useEffect(() => {
    if (!isLoaded || disabled) return;

    const timer = window.setTimeout(() => {
      fetchPredictions(inputText);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [debounceMs, disabled, fetchPredictions, inputText, isLoaded]);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : '';

        return (
          <Autocomplete<GooglePlaceOption, false, false, true>
            freeSolo
            fullWidth={fullWidth}
            disabled={disabled || !apiKey || !!loadError}
            loading={loadingPredictions}
            options={options}
            value={null}
            inputValue={inputText || value}
            filterOptions={(items) => items}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;

              return option.label;
            }}
            isOptionEqualToValue={(option, selectedValue) => {
              if (typeof selectedValue === 'string') {
                return option.label === selectedValue;
              }

              return option.placeId === selectedValue.placeId;
            }}
            onInputChange={(_, nextValue, reason: AutocompleteInputChangeReason) => {
              setInputText(nextValue);

              if (reason === 'input' || reason === 'clear') {
                field.onChange(nextValue);
              }
            }}
            onChange={(_, option) => {
              if (!option) {
                field.onChange('');
                setInputText('');
                setOptions([]);
                return;
              }

              if (typeof option === 'string') {
                field.onChange(option);
                setInputText(option);
                return;
              }

              field.onChange(option.label);
              setInputText(option.label);
              setOptions([]);
              fetchPlaceDetails(option);
            }}
            renderInput={(params) => (
                <TextField
                  {...params}
                  {...textFieldProps}
                  size={textFieldProps?.size || 'small'}
                  label={label}
                  placeholder={placeholder}
                  fullWidth={fullWidth}
                  required={isRequired}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ||
                    helperText ||
                    (!apiKey
                      ? 'Chưa cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
                      : loadError
                        ? 'Không tải được Google Maps API'
                        : undefined)
                  }
                  sx={[
                    {
                      '& .MuiInputBase-root': {
                        minHeight: 44,
                        height: 44,
                        borderRadius: 2,
                      },
                      '& .MuiOutlinedInput-root': {
                        py: '0 !important',
                      },
                      '& .MuiOutlinedInput-input': {
                        py: '0 !important',
                        height: 44,
                        boxSizing: 'border-box',
                      },
                      '& .MuiAutocomplete-endAdornment': {
                        top: '50%',
                        transform: 'translateY(-50%)',
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