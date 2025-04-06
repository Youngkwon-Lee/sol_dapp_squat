'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const WalletProvider = dynamic(
  () => import('./ClientWalletProvider'),
  {
    ssr: false,
    loading: () => <div className="text-center p-4">지갑 연결 중...</div>,
  }
);

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
} 