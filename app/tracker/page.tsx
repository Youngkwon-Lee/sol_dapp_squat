'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SquatCounter from '../components/SquatCounter';
import NFTMinter from '../components/NFTMinter';
import Airdrop from '../components/Airdrop';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Tracker() {
  const [squatCount, setSquatCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const targetSquats = 30;
  const wallet = useWallet();

  useEffect(() => {
    if (squatCount >= targetSquats && !isCompleted) {
      setIsCompleted(true);
    }
  }, [squatCount, isCompleted]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← 돌아가기
          </Link>
          <h1 className="text-4xl font-bold text-center text-white">스쿼트 트래커</h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">현재 진행 상황</h2>
            {wallet.publicKey && <Airdrop />}
          </div>

          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((squatCount / targetSquats) * 100, 100)}%` }}
            />
          </div>
          
          <p className="text-center text-2xl mb-6 text-white font-bold">
            {squatCount} / {targetSquats} 스쿼트 완료
          </p>

          <div className="grid grid-cols-1 gap-4">
            <SquatCounter 
              count={squatCount}
              onCountChange={setSquatCount}
            />
            <NFTMinter isEnabled={isCompleted} />
          </div>
        </div>
      </div>
    </main>
  );
} 