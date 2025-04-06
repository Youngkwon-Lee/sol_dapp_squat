'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useCallback, useState } from 'react';

// NFT 설정 임포트
const NFT_CONFIG = {
  name: "Squat Challenge NFT",
  symbol: "SQUAT",
  uri: "https://arweave.net/yOFBLvRGqHKZqMyqG8l_5wjhpb4H9BVZpG7PDaRUK-E", // 여기에 실제 메타데이터 URI를 넣어주세요
};

interface NFTMinterProps {
  isEnabled: boolean;
  onSuccess?: () => void;
}

const NFTMinter = ({ isEnabled, onSuccess }: NFTMinterProps) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const mintNFT = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);

    try {
      // Umi 인스턴스 생성
      const umi = createUmi(connection.rpcEndpoint)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet));

      // NFT mint signer 생성
      const mint = generateSigner(umi);

      // NFT 생성
      console.log('NFT 생성 중...');
      await createNft(umi, {
        mint,
        name: NFT_CONFIG.name,
        symbol: NFT_CONFIG.symbol,
        uri: NFT_CONFIG.uri,
        sellerFeeBasisPoints: percentAmount(0),
      }).sendAndConfirm(umi);

      console.log('NFT 발행 완료!');
      alert('NFT가 성공적으로 발행되었습니다! Phantom 지갑에서 확인해보세요.');
      onSuccess?.();
    } catch (error) {
      console.error('NFT 발행 중 오류 발생:', error);
      alert('NFT 발행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet, onSuccess]);

  return (
    <div className="text-center">
      <button
        onClick={mintNFT}
        disabled={!isEnabled || !wallet.publicKey || isLoading}
        className={`bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 px-4 rounded transition-all ${
          isEnabled && wallet.publicKey && !isLoading
            ? 'hover:brightness-110' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {isLoading ? '발행 중...' : 'NFT 발행하기'}
      </button>
      <p className="mt-2 text-sm text-gray-400">
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