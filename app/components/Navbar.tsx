'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-primary transition-colors">
            스쿼트 챌린지
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/tracker" className="text-white hover:text-primary transition-colors">
              Tracker
            </Link>
            <Link href="/minted" className="text-white hover:text-primary transition-colors">
              NFT
            </Link>
            <WalletMultiButton className="!bg-gradient-to-r from-primary to-secondary hover:brightness-110 transition-all" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 