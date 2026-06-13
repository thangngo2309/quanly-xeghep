import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Đặt xe ghép',
  description: 'Đặt xe ghép nhanh chóng, tiện lợi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}