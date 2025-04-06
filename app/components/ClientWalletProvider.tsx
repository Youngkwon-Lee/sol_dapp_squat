'use client';

import { FC, ReactNode } from 'react';
import AppWalletProvider from './AppWalletProvider';

const ClientWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <AppWalletProvider>{children}</AppWalletProvider>;
};

export default ClientWalletProvider; 