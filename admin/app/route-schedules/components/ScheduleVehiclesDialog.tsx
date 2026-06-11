'use client';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';

import type {
  RouteScheduleTemplateItem,
  RouteScheduleVehicleItem,
} from '@/api/route-schedules.api';

type ScheduleVehiclesDialogProps = {
  open: boolean;
  schedule?: RouteScheduleTemplateItem | null;
  loading?: boolean;
  onClose: () => void;
  onAddVehicle: () => void;
  onRemoveVehicle: (item: RouteScheduleVehicleItem) => void;
};

function getDirectionLabel(value: string) {
  return value === 'OUTBOUND' ? 'Chiều đi' : 'Chiều về';
}

function getStatusLabel(value: string) {
  return value === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động';
}

export function ScheduleVehiclesDialog({
  open,
  schedule,
  loading,
  onClose,
  onAddVehicle,
  onRemoveVehicle,
}: ScheduleVehiclesDialogProps) {
  const vehicles = schedule?.vehicles || [];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 800 }}>
          Xe vòng quay
        </Typography>

        {schedule && (
          <Typography
            component="div"
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {schedule.name}
          </Typography>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {vehicles.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Chưa có xe nào tham gia vòng quay của lịch này.
            </Typography>
          </Box>
        ) : (
          <Box>
            {vehicles.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 2,
                  alignItems: {
                    xs: 'flex-start',
                    md: 'center',
                  },
                  justifyContent: 'space-between',
                  flexDirection: {
                    xs: 'column',
                    md: 'row',
                  },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {item.vehicle?.licensePlate || 'Không có biển số'}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.25 }}
                  >
                    Tài xế: {item.driver?.fullName || 'Tự lấy theo phân xe ngày'} ·{' '}
                    Xuất phát: {item.firstDepartureTime} ·{' '}
                    {getDirectionLabel(item.startDirection)}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.25 }}
                  >
                    Áp dụng: {item.activeFrom}
                    {item.activeTo ? ` đến ${item.activeTo}` : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={getStatusLabel(item.status)}
                    color={item.status === 'ACTIVE' ? 'success' : 'default'}
                  />

                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={loading}
                    onClick={() => onRemoveVehicle(item)}
                  >
                    Xóa
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onAddVehicle} disabled={loading}>
          Thêm xe
        </Button>

        <Button onClick={onClose} disabled={loading}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}