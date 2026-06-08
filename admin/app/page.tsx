'use client';

import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import { AdminLayout } from './layouts/admin';

const stats = [
  {
    title: 'Booking hôm nay',
    value: '0',
    description: 'Tổng yêu cầu đặt xe trong ngày',
    icon: '📋',
  },
  {
    title: 'Chuyến đang chạy',
    value: '0',
    description: 'Các chuyến đang được điều phối',
    icon: '🧭',
  },
  {
    title: 'Xe còn trống',
    value: '0',
    description: 'Số xe còn khả năng nhận khách',
    icon: '🚐',
  },
  {
    title: 'Tài xế hoạt động',
    value: '0',
    description: 'Tài xế đang sẵn sàng vận hành',
    icon: '🚕',
  },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Tổng quan hệ thống
          </Typography>

          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
            Theo dõi nhanh tình hình booking, chuyến xe, tài xế và vận hành.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {stats.map((item) => (
            <Card
              key={item.title}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                      {item.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      bgcolor: '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>

                <Typography
                  sx={{
                    color: 'text.secondary',
                    mt: 2,
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '1.3fr 0.7fr',
            },
            gap: 2,
            mt: 3,
          }}
        >
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Hiệu suất ghép xe
              </Typography>

              <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
                Tỷ lệ ghép xe thành công trong ngày.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    Tỷ lệ thành công
                  </Typography>

                  <Typography sx={{ fontWeight: 800 }}>0%</Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={0}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Trạng thái hệ thống
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="API: Online" color="success" />
                <Chip label="DB: Connected" color="success" />
                <Chip label="Redis: Ready" color="success" />
              </Box>

              <Typography
                sx={{
                  color: 'text.secondary',
                  mt: 2,
                  lineHeight: 1.7,
                }}
              >
                Dashboard hiện là bản giao diện nền. Các chỉ số sẽ được kết nối
                API thống kê sau khi hoàn thiện module booking, chuyến xe và tài
                xế.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </AdminLayout>
  );
}