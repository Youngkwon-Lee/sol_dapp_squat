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
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            ← 돌아가기
          </Link>
          <h1 className="text-2xl font-bold">스쿼트 트래커</h1>
          <WalletMultiButton />
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6 text-white">
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

          <div className="grid grid-cols-1 gap-6">
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => {
                    setUseCamera(!useCamera);
                    setError(null);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                >
                  {useCamera ? '수동 모드로 전환' : '카메라 모드로 전환'}
                </button>
              </div>

              {error && (
                <div className="text-red-500 mb-4 p-2 bg-red-100 rounded">
                  {error}
                </div>
              )}

              {useCamera ? (
                <div className="mb-6">
                  <SquatDetector 
                    onSquatComplete={handleSquat} 
                    onError={handleError}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-4">수동 카운터</h2>
                  <div className="text-4xl font-bold mb-4">{squatCount}</div>
                  <button
                    onClick={handleSquat}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    disabled={squatCount >= targetSquats}
                  >
                    스쿼트 완료
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
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