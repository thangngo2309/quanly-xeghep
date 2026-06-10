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
  RouteDriverAssignmentItem,
  TransportRouteItem,
} from '@/api/routes.api';

type RouteDriversDialogProps = {
  open: boolean;
  route?: TransportRouteItem | null;
  loading?: boolean;
  assignments: RouteDriverAssignmentItem[];
  onClose: () => void;
  onEndAssignment: (assignment: RouteDriverAssignmentItem) => void;
};

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('vi-VN');
}

export function RouteDriversDialog({
  open,
  route,
  loading,
  assignments,
  onClose,
  onEndAssignment,
}: RouteDriversDialogProps) {
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
          Tài xế đang chạy tuyến
        </Typography>

        {route && (
          <Typography
            component="div"
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {route.name}
          </Typography>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {assignments.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Chưa có tài xế đang được phân công cho tuyến này.
            </Typography>
          </Box>
        ) : (
          <Box>
            {assignments.map((assignment) => (
              <Box
                key={assignment.id}
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
                    {assignment.driver?.fullName || 'Không có tên tài xế'}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.25 }}
                  >
                    SĐT: {assignment.driver?.phone || '-'} · Bắt đầu:{' '}
                    {formatDate(assignment.startedAt)}
                  </Typography>

                  {assignment.note && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      Ghi chú: {assignment.note}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Chip size="small" color="success" label="Đang chạy" />

                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    disabled={loading}
                    onClick={() => onEndAssignment(assignment)}
                  >
                    Kết thúc
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}