'use client';

import {
  Avatar,
  Box,
  Button,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useHDialog } from '@/components/dialog';
import { getActiveMenuLabel } from './menu';
import { AuthUser } from '@/types/auth.types';
import { clearAuthData } from '@/helper/auth-storage';

type AdminHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user: AuthUser;
};

export function AdminHeader({
  collapsed,
  onToggleSidebar,
  user,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useHDialog();

  async function handleLogout() {
    const ok = await dialog.confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy',
    });

    if (!ok) return;

    clearAuthData();
    router.replace('/login');
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: 72,
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        px: {
          xs: 2,
          md: 3,
        },
        bgcolor: '#fff',
      }}
    >
      <Button
        onClick={onToggleSidebar}
        variant="outlined"
        sx={{
          minWidth: 42,
          width: 42,
          height: 42,
          p: 0,
          borderRadius: 2,
        }}
      >
        {collapsed ? '☰' : '‹'}
      </Button>

      <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          {getActiveMenuLabel(pathname)}
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: 13,
            mt: 0.25,
          }}
        >
          Hệ thống quản lý ghép xe thông minh
        </Typography>
      </Box>

      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'flex',
          },
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#0f766e',
            width: 40,
            height: 40,
            fontWeight: 800,
          }}
        >
          {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>

        <Box sx={{ minWidth: 140 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
            {user.fullName}
          </Typography>

          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            {user.role}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Button color="error" onClick={handleLogout}>
          Đăng xuất
        </Button>
      </Box>
    </Paper>
  );
}