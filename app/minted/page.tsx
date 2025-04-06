'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Metaplex } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface NFT {
  name: string;
  image: string;
  description: string;
  mintAddress: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function Minted() {
  const wallet = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!wallet.publicKey) {
        setLoading(false);
        return;
      }

      try {
        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl('devnet'));
        const metaplex = new Metaplex(connection);
        
        // 지갑의 모든 NFT 가져오기
        const myNfts = await metaplex.nfts().findAllByOwner({ owner: wallet.publicKey });

        const nftData = await Promise.all(
          myNfts.map(async (nft) => {
            try {
              if (!nft.uri) return null;
              
              const response = await fetch(nft.uri);
              const json = await response.json();
              
              return {
                name: nft.name,
                image: json.image,
                description: json.description || '',
                mintAddress: nft.address.toString(),
                ...(json.attributes ? { attributes: json.attributes } : {})
              } as NFT;
            } catch (error) {
              console.error('Error fetching NFT metadata:', error);
              return null;
            }
          })
        );

        setNfts(nftData.filter((nft): nft is NFT => nft !== null));
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [wallet.publicKey]);

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <Link href="/" className="text-gray-400 hover:text-white">
              ← 돌아가기
            </Link>
            <h1 className="text-4xl font-bold gradient-text">
              획득한 NFT
            </h1>
            <div className="w-20"></div>
          </div>
          
          <div className="glass-card p-8">
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>NFT를 불러오는 중...</p>
              </div>
            ) : !wallet.publicKey ? (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">👛</div>
                <p className="text-gray-400">지갑을 연결해주세요</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-gray-400">아직 획득한 NFT가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft, index) => (
                  <div 
                    key={index} 
                    className="bg-black/30 rounded-lg p-4 cursor-pointer transform transition-transform hover:scale-105"
                    onClick={() => setSelectedNft(nft)}
                  >
                    <img 
                      src={nft.image} 
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg mb-4" 
                    />
                    <h3 className="text-lg font-bold mb-2">{nft.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{nft.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 space-y-4">
              <Link href="/tracker" className="btn-primary w-full block text-center">
                스쿼트 하러 가기
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* NFT 세부정보 모달 */}
      {selectedNft && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setSelectedNft(null)}
            >
              ✕
            </button>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <img 
                  src={selectedNft.image} 
                  alt={selectedNft.name}
                  className="w-full rounded-lg" 
                />
              </div>
              
              <div className="md:w-1/2">
                <h2 className="text-2xl font-bold mb-4">{selectedNft.name}</h2>
                <p className="text-gray-400 mb-6">{selectedNft.description}</p>
                
                {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">특성</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedNft.attributes.map((attr, idx) => (
                        <div key={idx} className="bg-black/30 p-3 rounded">
                          <div className="text-sm text-gray-400">{attr.trait_type}</div>
                          <div className="font-medium">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">민트 주소</h3>
                  <a 
                    href={`https://explorer.solana.com/address/${selectedNft.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedNft.mintAddress}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 