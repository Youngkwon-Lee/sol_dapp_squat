'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import { Providers } from './components/Providers';
import { AuthProvider } from '../contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-16 bg-black">
              {children}
            </main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
} 