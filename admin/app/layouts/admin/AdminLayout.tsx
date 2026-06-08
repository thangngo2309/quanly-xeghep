'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminFooter } from './AdminFooter';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { getMenuByRole } from './menu';
import { AuthUser } from '@/types/auth.types';
import { getAccessToken, getAuthUser } from '@/helper/auth-storage';

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const currentUser = getAuthUser();

    if (!token || !currentUser) {
      router.replace('/login');
      return;
    }

    setUser(currentUser);
    setCheckingAuth(false);
  }, [router]);

  const menuItems = useMemo(() => {
    return getMenuByRole(user?.role);
  }, [user?.role]);

  if (checkingAuth || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />

          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Đang kiểm tra phiên đăng nhập...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
      }}
    >
      <AdminSidebar collapsed={collapsed} menuItems={menuItems} />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AdminHeader
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          user={user}
        />

        <Box
          sx={{
            flex: 1,
            p: {
              xs: 1.5,
              md: 2,
            },
            overflow: 'auto',
          }}        
        >
          {children}
        </Box>

        <AdminFooter />
      </Box>
    </Box>
  );
}