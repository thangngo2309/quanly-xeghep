'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { driverLoginApi } from '@/api/driver.api';
import { getApiErrorMessage, getDriverToken } from '@/api/http';
import { useEffect, useState } from 'react';

type DriverLoginFormValues = {
  phone: string;
  password: string;
};

export default function DriverLoginPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverLoginFormValues>({
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = getDriverToken();

    if (token) {
      window.location.href = 'xeghep/driver/trips';
    }
  }, []);

  const onSubmit: SubmitHandler<DriverLoginFormValues> = async (values) => {
    setLoading(true);
    setErrorMessage('');

    try {
      await driverLoginApi({
        phone: values.phone.trim(),
        password: values.password,
      });

      window.location.href = '/xeghep/driver/trips';
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f3f7f6',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Tài xế đăng nhập
              </Typography>

              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                Xem chuyến xe và danh sách khách cần đón.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                {errorMessage && (
                  <Alert severity="error">{errorMessage}</Alert>
                )}

                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    required: 'Vui lòng nhập số điện thoại',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Số điện thoại"
                      placeholder="Nhập số điện thoại"
                      fullWidth
                      size="small"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: 'Vui lòng nhập mật khẩu',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Mật khẩu"
                      placeholder="Nhập mật khẩu"
                      fullWidth
                      size="small"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    height: 46,
                    borderRadius: 999,
                    fontWeight: 900,
                  }}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}