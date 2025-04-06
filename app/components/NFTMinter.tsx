'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useState } from 'react';

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
      console.log('NFT 생성 중...');
      const { nft } = await metaplex.nfts().create({
        name: NFT_CONFIG.name,
        symbol: NFT_CONFIG.symbol,
        uri: NFT_CONFIG.uri,
        sellerFeeBasisPoints: 0,
      });

      console.log('NFT 발행 완료!', nft);
      alert('NFT가 성공적으로 발행되었습니다! Phantom 지갑에서 확인해보세요.');
      onSuccess?.();
    } catch (error) {
      console.error('NFT 발행 중 오류 발생:', error);
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