import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Quản lý xe ghép',
  description: 'Hệ thống quản lý xe ghép thông minh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}