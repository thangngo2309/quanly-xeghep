'use client';

import { Box, Typography } from '@mui/material';

export function AdminFooter() {
  return (
    <Box
      sx={{
        height: 52,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        © 2026 Xe Ghép Platform
      </Typography>

      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        API-first Transport Management
      </Typography>
    </Box>
  );
}