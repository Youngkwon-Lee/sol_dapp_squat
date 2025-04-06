'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';

const PoseNet = dynamic(() => import('./components/PoseNet'), {
  ssr: false,
  loading: () => <div>카메라 로딩중...</div>
});

const NFTMinter = dynamic(() => import('./components/NFTMinter'), {
  ssr: false,
  loading: () => <div>NFT 민터 로딩중...</div>
});

export default function Home() {
  const [isNFTMintEnabled, setIsNFTMintEnabled] = useState(false);
  const [showPoseNet, setShowPoseNet] = useState(false);

  const handleSquatComplete = () => {
    console.log('스쿼트 30회 완료!');
    setIsNFTMintEnabled(true);
  };

  const handleStartChallenge = () => {
    setShowPoseNet(true);
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 sm:mb-6 gradient-text">
            스쿼트 챌린지
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 px-4">
            매일 30개의 스쿼트를 완료하고 NFT를 획득하세요!
          </p>
          
          {!showPoseNet ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-8 max-w-2xl mx-auto px-4">
              <Link 
                href="/tracker"
                className="glass-card p-6 sm:p-8 group hover:scale-105 transition-transform duration-300 cursor-pointer bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🏋️</div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-purple-300">스쿼트 시작하기</h2>
                <p className="text-sm sm:text-base text-purple-200/70">오늘의 스쿼트 챌린지를 시작하고 NFT를 획득하세요!</p>
              </Link>
              
              <Link href="/minted" className="glass-card p-6 sm:p-8 group hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎨</div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-purple-300">획득한 NFT</h2>
                <p className="text-sm sm:text-base text-purple-200/70">지금까지 획득한 NFT 컬렉션을 확인하세요!</p>
              </Link>

              <Link href="/analytics" className="glass-card p-6 sm:p-8 group hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-purple-300">운동 분석</h2>
                <p className="text-sm sm:text-base text-purple-200/70">운동 통계와 진행 상황을 분석해보세요!</p>
              </Link>
            </div>
          ) : (
            <>
              <PoseNet onSquatComplete={handleSquatComplete} />
              {isNFTMintEnabled && <NFTMinter isEnabled={isNFTMintEnabled} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 