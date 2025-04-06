'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const Airdrop = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAirdrop = async () => {
    if (!publicKey) {
      setError('지갑이 연결되어 있지 않습니다.');
      return;
    }

    try {
      setIsAirdropping(true);
      setError(null);

      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);

      alert('1 SOL이 지갑에 입금되었습니다!');
    } catch (err) {
      console.error('Airdrop 오류:', err);
      setError('SOL 받기에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAirdropping(false);
    }
  };

  return (
    <div className="text-center mt-4">
      {error && (
        <p className="text-red-400 mb-2 text-sm">{error}</p>
      )}
      
      <button
        onClick={requestAirdrop}
        disabled={isAirdropping || !publicKey}
        className={`px-4 py-2 rounded text-sm text-white transition-colors ${
          !isAirdropping && publicKey
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {isAirdropping ? 'SOL 받는 중...' : 'Devnet SOL 받기'}
      </button>
    </div>
  );
};

export default Airdrop; 