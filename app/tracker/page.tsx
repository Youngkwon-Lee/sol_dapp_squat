'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import Link from 'next/link';
import NFTMinter from '../components/NFTMinter';
import dynamic from 'next/dynamic';

// 동적으로 SquatDetector 컴포넌트 import
const SquatDetector = dynamic(() => import('../components/SquatDetector'), {
  ssr: false,
  loading: () => <div className="text-center p-4">카메라 모듈 로딩 중...</div>
});

export default function Tracker() {
  const { publicKey } = useWallet();
  const [squatCount, setSquatCount] = useState(0);
  const [useCamera, setUseCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetSquats = 30;

  const handleSquat = () => {
    setSquatCount(prev => Math.min(prev + 1, targetSquats));
  };

  const handleError = (message: string) => {
    setError(message);
    setUseCamera(false);
  };

  const progress = (squatCount / targetSquats) * 100;

  return (
    <main className="min-h-screen p-4 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 order-1 sm:order-none">
            ← 돌아가기
          </Link>
          <h1 className="text-2xl font-bold order-0 sm:order-none">스쿼트 트래커</h1>
          <div className="order-2 sm:order-none w-full sm:w-auto">
            <WalletMultiButton className="!w-full sm:!w-auto" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">진행률</span>
              <span className="text-sm font-medium">{squatCount}/{targetSquats}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setUseCamera(!useCamera);
                  setError(null);
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto"
              >
                {useCamera ? '수동 모드로 전환' : '카메라 모드로 전환'}
              </button>
            </div>

            {error && (
              <div className="text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            {useCamera ? (
              <div className="aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
                <SquatDetector 
                  onSquatComplete={handleSquat} 
                  onError={handleError}
                />
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <h2 className="text-xl font-bold mb-4">수동 카운터</h2>
                <div className="text-5xl font-bold mb-6">{squatCount}</div>
                <button
                  onClick={handleSquat}
                  disabled={squatCount >= targetSquats}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-lg w-full sm:w-auto"
                >
                  스쿼트 완료
                </button>
              </div>
            )}

            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <h2 className="text-xl font-bold mb-4">NFT 발행</h2>
              <NFTMinter 
                isEnabled={squatCount >= targetSquats}
                onSuccess={() => setSquatCount(0)}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 