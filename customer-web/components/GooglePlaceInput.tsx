'use client';

import { TextField } from '@mui/material';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useState } from 'react';

export type GooglePlaceValue = {
  address: string;
  lat?: number;
  lng?: number;
};

type GooglePlaceInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  onChange: (value: GooglePlaceValue) => void;
};

const libraries: 'places'[] = ['places'];

export default function GooglePlaceInput({
  label,
  placeholder,
  value,
  required,
  helperText,
  errorText,
  onChange,
}: GooglePlaceInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const inputHelperText = useMemo(() => {
    if (errorText) return errorText;
    if (!apiKey) return 'Chưa cấu hình Google Maps API key';
    if (loadError) return 'Không tải được Google Maps';
    return helperText;
  }, [apiKey, errorText, helperText, loadError]);

  const input = (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value}
      required={required}
      fullWidth
      size="small"
      error={!!errorText}
      helperText={inputHelperText}
      onChange={(event) =>
        onChange({
          address: event.target.value,
        })
      }
    />
  );

  if (!isLoaded || loadError) {
    return input;
  }

  return (
    <StandaloneSearchBox
      onLoad={(ref) => setSearchBox(ref)}
      onPlacesChanged={() => {
        const places = searchBox?.getPlaces();
        const place = places?.[0];

        if (!place) return;

        const address = place.formatted_address || place.name || value;
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();

        onChange({
          address,
          lat,
          lng,
        });
      }}
    >
      {input}
    </StandaloneSearchBox>
  );
}