'use client';

import { Box, type BoxProps } from '@mui/material';
import {
  FieldValues,
  FormProvider,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

type HFormProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  sx?: BoxProps['sx'];
  id?: string;
  noValidate?: boolean;
};

export function HForm<T extends FieldValues>({
  methods,
  onSubmit,
  children,
  sx,
  id,
  noValidate = true,
}: HFormProps<T>) {
  return (
    <FormProvider {...methods}>
      <Box
        id={id}
        component="form"
        noValidate={noValidate}
        onSubmit={methods.handleSubmit(onSubmit)}
        sx={sx}
      >
        {children}
      </Box>
    </FormProvider>
  );
}