import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import { Providers } from './components/Providers';
import { AuthProvider } from '../contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '스쿼트 챌린지',
  description: '스쿼트를 완료하고 NFT 보상을 받아보세요!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="min-h-screen pt-16 bg-black">
              {children}
            </main>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
} 