'use client';

import { Box, Button, Tooltip, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import type { AdminMenuItem } from './menu';

type AdminSidebarProps = {
  collapsed: boolean;
  menuItems: AdminMenuItem[];
};

export function AdminSidebar({ collapsed, menuItems }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';

    return pathname.startsWith(href);
  }

  return (
    <Box
      sx={{
        width: collapsed ? 76 : 280,
        flexShrink: 0,
        minHeight: '100vh',
        bgcolor: '#0f766e',
        color: '#fff',
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          px: collapsed ? 1.5 : 2,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: 'rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          🚗
        </Box>

        {!collapsed && (
          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              Xe Ghép
            </Typography>

            <Typography
              sx={{
                opacity: 0.72,
                fontSize: 13,
                whiteSpace: 'nowrap',
              }}
            >
              Admin Platform
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          py: 2,
          px: collapsed ? 1 : 1.5,
          overflowY: 'auto',
        }}
      >
        {menuItems.map((item) => {
          const active = isActive(item.href);

          const button = (
            <Button
              key={item.key}
              fullWidth
              onClick={() => router.push(item.href)}
              sx={{
                minHeight: 46,
                mb: 0.75,
                px: collapsed ? 0 : 1.25,
                justifyContent: collapsed ? 'center' : 'flex-start',
                bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#fff',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: active
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>

              {!collapsed && (
                <Typography
                  sx={{
                    ml: 1,
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                    textAlign: 'left',
                    flex: 1,
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </Button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key} title={item.label} placement="right">
                {button}
              </Tooltip>
            );
          }

          return button;
        })}
      </Box>

      {!collapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Typography sx={{ fontSize: 12, opacity: 0.72 }}>
            © 2026 Xe Ghép Platform
          </Typography>
        </Box>
      )}
    </Box>
  );
}