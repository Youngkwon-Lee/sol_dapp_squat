'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NFTMinter from '../components/NFTMinter';
import dynamic from 'next/dynamic';
import { useAuth } from '../../contexts/AuthContext';
import { saveWorkoutSession } from '../../services/workoutService';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseClient';

// 동적으로 SquatDetector 컴포넌트 import
const SquatDetector = dynamic(() => import('../components/SquatDetector'), {
  ssr: false,
  loading: () => <div className="text-center p-4">카메라 모듈 로딩 중...</div>
});

export default function Tracker() {
  const { publicKey } = useWallet();
  const { user } = useAuth();
  const [squatCount, setSquatCount] = useState(0);
  const [useCamera, setUseCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetSquats = 30;
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (squatCount === 1) {
      setStartTime(Date.now());
    }
  }, [squatCount]);

  const handleSquat = () => {
    setSquatCount(prev => Math.min(prev + 1, targetSquats));
  };

  const handleError = (message: string) => {
    setError(message);
    setUseCamera(false);
  };

  const progress = (squatCount / targetSquats) * 100;

  const handleSave = async () => {
    if (!user && !publicKey) {
      setError('운동 기록을 저장하려면 Google 로그인이나 지갑 연결이 필요합니다.');
      return;
    }

    if (squatCount === 0) {
      setError('최소 1회 이상의 스쿼트를 해야 저장할 수 있습니다.');
      return;
    }

    try {
      const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      
      const workoutData = {
        squatCount,
        duration,
        timestamp: Timestamp.now(),
        usedWebcam: useCamera,
        ...(user 
          ? { userId: user.uid } 
          : { walletAddress: publicKey?.toString() || '' }
        )
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      
      alert('운동 기록이 저장되었습니다!');
      setSquatCount(0);
      setStartTime(null);
      setError(null);
    } catch (error) {
      console.error('운동 기록 저장 실패:', error);
      setError('운동 기록 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <main className="min-h-screen p-2 sm:p-4 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm sm:text-base order-1 sm:order-none">
            ← 돌아가기
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold order-0 sm:order-none">스쿼트 트래커</h1>
          <div className="order-2 sm:order-none w-full sm:w-auto">
            <WalletMultiButton className="!w-full !py-2 sm:!py-3 !text-sm sm:!text-base sm:!w-auto" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium">진행률</span>
              <span className="text-xs sm:text-sm font-medium">{squatCount}/{targetSquats}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setUseCamera(!useCamera);
                  setError(null);
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg w-full text-sm sm:text-base sm:w-auto transition-all duration-300"
              >
                {useCamera ? '수동 모드로 전환' : '카메라 모드로 전환'}
              </button>
            </div>

            {error && (
              <div className="text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg p-3 sm:p-4 text-xs sm:text-sm">
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
              <div className="text-center p-3 sm:p-4 bg-gray-700 rounded-lg">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">수동 카운터</h2>
                <div className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-6">{squatCount}</div>
                <button
                  onClick={handleSquat}
                  disabled={squatCount >= targetSquats}
                  className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:from-gray-600 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-base sm:text-lg w-full sm:w-auto transition-all duration-300"
                >
                  스쿼트 완료
                </button>
              </div>
            )}

            <div className="text-center p-3 sm:p-4 bg-gray-700 rounded-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">NFT 발행</h2>
              <NFTMinter 
                isEnabled={squatCount >= targetSquats}
                onSuccess={() => setSquatCount(0)}
              />
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-lg sm:text-xl font-bold transition-all duration-300 w-full sm:w-auto"
              >
                운동 저장하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 