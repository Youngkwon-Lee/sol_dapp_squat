'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/firebaseClient';
import { usePathname } from 'next/navigation';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const PhantomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="64" cy="64" r="64" fill="white"/>
    <path d="M110.584 64.9142C110.584 89.5152 90.716 109.383 66.115 109.383C41.514 109.383 21.646 89.5152 21.646 64.9142C21.646 40.3132 41.514 20.4452 66.115 20.4452C90.716 20.4452 110.584 40.3132 110.584 64.9142Z" fill="#AB9FF2"/>
    <path d="M66.115 109.383C90.716 109.383 110.584 89.5152 110.584 64.9142C110.584 40.3132 90.716 20.4452 66.115 20.4452C41.514 20.4452 21.646 40.3132 21.646 64.9142C21.646 89.5152 41.514 109.383 66.115 109.383ZM66.115 109.383C66.115 109.383 97.35 109.383 97.35 64.9142C97.35 20.4452 66.115 20.4452 66.115 20.4452" stroke="#513C9E" strokeWidth="2"/>
  </svg>
);

const NAV_ITEMS = [
  { href: '/tracker', label: '운동하기' },
  { href: '/minted', label: 'NFT' },
  { href: '/analytics', label: '분석' },
] as const;

export default function Navbar() {
  const { user, signOut } = useAuth();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    if (wallet.connected) {
      await wallet.disconnect();
    }
    await signOut();
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Google 로그인 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    try {
      if (!window?.solana?.isPhantom) {
        // 팬텀 지갑이 설치되어 있지 않은 경우
        window.open('https://phantom.app/', '_blank');
      } else {
        // 팬텀 지갑이 설치되어 있는 경우
        if (wallet.wallet && !wallet.connected) {
          await wallet.connect();
        }
        setShowLoginModal(false);
      }
    } catch (error) {
      console.error('지갑 연결 에러:', error);
    }
  };

  // 지갑 연결 상태 감지
  useEffect(() => {
    if (wallet.connected) {
      setShowLoginModal(false);
    }
  }, [wallet.connected]);

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/squat_P_log.png" 
                  alt="Squat Challenge Logo" 
                  width={64} 
                  height={64} 
                  className="mr-2"
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'text-purple-400'
                      : 'text-gray-300 hover:text-purple-400'
                  } transition-colors`}
                >
                  {item.label}
                </Link>
              ))}
              {!user && !wallet.connected ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 rounded-lg text-white hover:brightness-110 transition-all"
                >
                  로그인
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  {wallet.connected && wallet.publicKey && (
                    <span className="text-sm text-purple-400">
                      {wallet.publicKey.toString().slice(0, 4)}...
                      {wallet.publicKey.toString().slice(-4)}
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 rounded-lg text-white hover:brightness-110 transition-all"
                  >
                    {wallet.connected ? '지갑 연결 해제' : '로그아웃'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 로그인 선택 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-bold mb-6 text-center">로그인 방식 선택</h3>
            <div className="space-y-4">
              <div className="w-full flex flex-col items-center space-y-4">
                <style jsx global>{`
                  .wallet-adapter-button-trigger {
                    width: 100% !important;
                    height: 40px !important;
                    background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
                    --tw-gradient-from: #a855f7 !important;
                    --tw-gradient-to: #7e22ce !important;
                    border-radius: 0.5rem !important;
                    font-size: 16px !important;
                    font-weight: normal !important;
                    color: white !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    padding: 0 16px !important;
                  }
                  .wallet-adapter-button-trigger::before {
                    content: "" !important;
                    width: 20px !important;
                    height: 20px !important;
                    background-image: url('/Phantom-Icon_App_128x128.png') !important;
                    background-size: contain !important;
                    background-repeat: no-repeat !important;
                    background-position: center !important;
                    margin-right: 8px !important;
                  }
                  .wallet-adapter-button-trigger .wallet-adapter-button-start-icon {
                    display: none !important;
                  }
                  .wallet-adapter-button-trigger:hover {
                    background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
                    --tw-gradient-from: #a855f7 !important;
                    --tw-gradient-to: #7e22ce !important;
                    filter: brightness(110%) !important;
                  }
                  .wallet-adapter-dropdown {
                    width: 100% !important;
                  }
                  .wallet-adapter-dropdown-list {
                    margin: 0 !important;
                    width: auto !important;
                  }
                `}</style>
                <div className="w-full">
                  <WalletMultiButton />
                </div>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">또는</span>
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-10 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google로 로그인</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(false)}
              className="mt-4 w-full text-gray-400 hover:text-white text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
} 