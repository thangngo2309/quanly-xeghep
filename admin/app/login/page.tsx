'use client';

import { http } from '@/api/http';
import { saveAuthData } from '@/helper/auth-storage';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import RouteIcon from '@mui/icons-material/Route';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type LoginResponse = {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    role: string;
    status: string;
  };
  accessToken: string;
  refreshToken: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setLoading(true);

    try {
      const response = await http.post<LoginResponse>('/auth/signin', {
        identifier,
        password,
      });

      saveAuthData({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      router.push('/');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

      setErrorMessage(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#eef5f4',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            border: '1px solid #dbe7e5',
            borderRadius: 5,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1.05fr 0.95fr',
              },
              minHeight: {
                xs: 'auto',
                md: 680,
              },
            }}
          >
            <Box
              sx={{
                p: {
                  xs: 3,
                  md: 6,
                },
                bgcolor: '#0f766e',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: 360,
                  height: 360,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  right: -120,
                  top: -120,
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  left: -100,
                  bottom: -100,
                }}
              />

              <Stack spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center"}}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(255,255,255,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DirectionsCarFilledIcon />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Xe Ghép Admin
                    </Typography>
                    <Typography sx={{ opacity: 0.8 }}>
                      Smart Transport Platform
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Chip
                    label="API-first platform"
                    sx={{
                      width: 'fit-content',
                      bgcolor: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      maxWidth: 520,
                      lineHeight: 1.15,
                      fontSize: {
                        xs: 34,
                        md: 48,
                      },
                    }}
                  >
                    Quản lý ghép xe thông minh cho nhà xe
                  </Typography>

                  <Typography
                    sx={{
                      maxWidth: 520,
                      fontSize: 17,
                      lineHeight: 1.8,
                      opacity: 0.86,
                    }}
                  >
                    Theo dõi booking, chuyến xe, tài xế, xe trống chỗ và điều
                    phối vận hành trên cùng một hệ thống quản trị.
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <FeatureItem
                    icon={<RouteIcon />}
                    title="Điều phối chuyến"
                    description="Quản lý tuyến, khung giờ, ghế trống và khách cần đưa đón."
                  />

                  <FeatureItem
                    icon={<PhoneIphoneIcon />}
                    title="Kết nối API"
                    description="Nhà xe gửi booking từ app hoặc website riêng vào hệ thống."
                  />
                </Stack>
              </Stack>

              <Typography
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  opacity: 0.75,
                  mt: {
                    xs: 6,
                    md: 0,
                  },
                }}
              >
                © 2026 Xe Ghép Platform
              </Typography>
            </Box>

            <Box
              sx={{
                p: {
                  xs: 3,
                  sm: 5,
                  md: 7,
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff',
              }}
            >
              <Card
                elevation={0}
                sx={{
                  width: '100%',
                  maxWidth: 440,
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Stack spacing={3}>
                    <Stack spacing={1}>
                      <Typography variant="h4">
                        Đăng nhập
                      </Typography>

                      <Typography color="text.secondary">
                        Nhập tài khoản được cấp để vào trang quản trị.
                      </Typography>
                    </Stack>

                    <Divider />

                    {errorMessage && (
                      <Alert severity="error">{errorMessage}</Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                      <Stack spacing={2.5}>
                        <TextField
                          label="Số điện thoại hoặc email"
                          value={identifier}
                          onChange={(event) =>
                            setIdentifier(event.target.value)
                          }
                          fullWidth
                          required
                          autoComplete="username"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIphoneIcon color="action" />
                                </InputAdornment>
                              ),
                            },
                          }}
                        
                        />

                        <TextField
                          label="Mật khẩu"
                          type="password"
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          fullWidth
                          required
                          autoComplete="current-password"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIphoneIcon color="action" />
                                </InputAdornment>
                              ),
                            },
                          }}
                        
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{
                            py: 1.4,
                            fontSize: 16,
                            bgcolor: '#0f766e',
                            '&:hover': {
                              bgcolor: '#115e59',
                            },
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'Đăng nhập'
                          )}
                        </Button>
                      </Stack>
                    </Box>

                    <Alert severity="info">
                      Tài khoản đầu tiên sẽ được tạo bằng seed Super Admin khi
                      backend khởi động.
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
        <Typography sx={{ opacity: 0.78, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}