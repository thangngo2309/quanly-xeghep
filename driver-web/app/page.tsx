'use client';

import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { getDriverToken } from '@/api/http';

export default function HomePage() {
  useEffect(() => {
    const token = getDriverToken();

    // window.location.href = token ? '/trips' : '/login';
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f3f7f6',
      }}
    >
      <CircularProgress />
    </Box>
  );
}