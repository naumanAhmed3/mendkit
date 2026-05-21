import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MendKit — Self-Healing Web Automation',
  description:
    'Browser automations that survive UI changes. MendKit targets elements by a bundle of signals and re-finds them — rewriting broken selectors automatically — when the markup shifts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
