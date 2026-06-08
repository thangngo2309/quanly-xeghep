export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DRIVER';

export type AdminMenuItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '▦',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DRIVER'],
  },
  {
    key: 'users',
    label: 'Người dùng',
    href: '/users',
    icon: '👥',
    roles: ['SUPER_ADMIN'],
  },
  {
    key: 'companies',
    label: 'Nhà xe',
    href: '/companies',
    icon: '🏢',
    roles: ['SUPER_ADMIN'],
  },
  {
    key: 'drivers',
    label: 'Tài xế',
    href: '/drivers',
    icon: '🚕',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'vehicles',
    label: 'Xe',
    href: '/vehicles',
    icon: '🚐',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'routes',
    label: 'Tuyến đường',
    href: '/routes',
    icon: '〰',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'trips',
    label: 'Chuyến xe',
    href: '/trips',
    icon: '🧭',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DRIVER'],
  },
  {
    key: 'bookings',
    label: 'Booking',
    href: '/bookings',
    icon: '📋',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'api-clients',
    label: 'API Clients',
    href: '/api-clients',
    icon: '🔑',
    roles: ['SUPER_ADMIN'],
  },
  {
    key: 'settings',
    label: 'Cấu hình',
    href: '/settings',
    icon: '⚙',
    roles: ['SUPER_ADMIN'],
  },
];

export function getMenuByRole(role?: string | null) {
  if (!role) return [];

  return adminMenuItems.filter((item) =>
    item.roles.includes(role as UserRole),
  );
}

export function getActiveMenuLabel(pathname: string) {
  const active = adminMenuItems.find((item) => {
    if (item.href === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(item.href);
  });

  return active?.label || 'Dashboard';
}