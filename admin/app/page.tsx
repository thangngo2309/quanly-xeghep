'use client';

import { clearAuthData } from '@/helper/auth-storage';
import {
  AppBar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  function handleLogout() {
    clearAuthData();
    router.replace('/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
            Xe Ghép Admin
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid #dbe7e5',
            borderRadius: 4,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="h5">
              Đăng nhập thành công
            </Typography>

            <Typography color="text.secondary">
              Đây là dashboard tạm. Sau bước này mình sẽ làm layout admin chính:
              sidebar, header, menu quản lý user, nhà xe, tài xế, xe, chuyến.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}