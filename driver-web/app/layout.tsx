import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tài xế xe ghép',
  description: 'Web tài xế xem chuyến xe và danh sách khách',
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