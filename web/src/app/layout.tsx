import type { Metadata } from 'next';
import './globals.css';
import { UnitProvider } from '@/context/UnitContext';

export const metadata: Metadata = {
  title: 'OptiFit Labs',
  description: 'Plataforma integral de entrenamiento, nutrición y biohacking para atletas y entrenadores.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OptiFit Labs',
  },
  icons: {
    icon: '/app-icon.png',
    apple: '/app-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">
        <UnitProvider>{children}</UnitProvider>
      </body>
    </html>
  );
}
