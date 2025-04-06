'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseClient';

// NFT 설정
const NFT_CONFIG = {
  name: "Squat Challenge NFT",
  symbol: "SQUAT",
  uri: "https://arweave.net/yOFBLvRGqHKZqMyqG7l_5wjhpb4H9BVZpG7PDaRUK-E", // 여기에 실제 메타데이터 URI를 넣어주세요
};

interface NFTMinterProps {
  isEnabled: boolean;
  onSuccess?: () => void;
}

const NFTMinter = ({ isEnabled, onSuccess }: NFTMinterProps) => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const saveWorkoutRecord = async () => {
    if (!wallet.publicKey) {
      console.error('지갑이 연결되어 있지지 않습니다.');
      return;
    }

    try {
      console.log('운동 기록 저장 시작...');
      const walletAddress = wallet.publicKey.toString();
      
      // 현재 시간을 한국 시간으로 설정
      const now = new Date();
      const koreanTime = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      // 30회 스쿼트를 완료하는데 걸리는 예상 시간 (초)
      const estimatedDuration = 60; // 1분으로 예상

      const workoutData = {
        squatCount: 30,
        duration: estimatedDuration,
        timestamp: Timestamp.now(),
        usedWebcam: true,
        walletAddress,
        type: 'nft_mint',
        koreanTime,
        createdAt: Timestamp.now(),
        measurementMethod: '자세 인식'  // 측정 방식 추가
      };

      console.log('저장할 운동 데이터:', workoutData);

      // workouts 컬렉션에 문서 추가
      const workoutsRef = collection(db, 'workouts');
      await addDoc(workoutsRef, workoutData);
      console.log('운동 기록이 성공적으로 저장되었습니다.');

    } catch (error) {
      console.error('운동 기록 저장 실패:', error);
      throw error; // 에러를 상위로 전파하여 사용자에게 알림
    }
  };

  const mintNFT = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signMessage || !wallet.signAllTransactions) {
      alert('지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);

    try {
      // Metaplex 인스턴스 생성
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl('devnet'));
      const metaplex = new Metaplex(connection)
        .use(bundlrStorage());

      metaplex.identity().setDriver({
        publicKey: wallet.publicKey,
        signMessage: wallet.signMessage,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      });

      // NFT 생성
      console.log('NFT 생성 시작...');
      const { nft } = await metaplex.nfts().create({
        name: NFT_CONFIG.name,
        symbol: NFT_CONFIG.symbol,
        uri: NFT_CONFIG.uri,
        sellerFeeBasisPoints: 0,
      });
      console.log('NFT 생성 완료:', nft);

      // 운동 기록 저장
      console.log('운동 기록 저장 시도...');
      await saveWorkoutRecord();

      console.log('NFT 발행 완료!', nft);
      alert('NFT가 성공적으로 발행되었습니다! Phantom 지갑에서 확인해보세요.');
      onSuccess?.();
    } catch (error) {
      console.error('NFT 발행 중 오류 발생:', error);
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message);
        console.error('에러 스택:', error.stack);
      }
      alert('NFT 발행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [wallet, onSuccess]);

  return (
    <div className="text-center">
      <button
        onClick={mintNFT}
        disabled={!isEnabled || !wallet.publicKey || isLoading}
        className={`bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:from-gray-600 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded text-sm sm:text-base transition-all duration-300 w-full sm:w-auto ${
          isEnabled && wallet.publicKey && !isLoading
            ? 'hover:brightness-110' 
            : 'opacity-50'
        }`}
      >
        {isLoading ? '발행 중...' : 'NFT 발행하기'}
      </button>
      <p className="mt-2 text-xs sm:text-sm text-gray-400">
        {!wallet.publicKey 
          ? '지갑을 연결해주세요.'
          : isLoading
            ? 'NFT를 발행하고 있습니다...'
            : isEnabled 
              ? '축하합니다! NFT를 발행할 수 있습니다.' 
              : '30회의 스쿼트를 완료하면 NFT를 발행할 수 있습니다.'}
      </p>
    </div>
  );
};

export default NFTMinter; 