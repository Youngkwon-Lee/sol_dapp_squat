'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Metaplex } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl } from '@solana/web3.js';

interface NFT {
  name: string;
  image: string;
  description: string;
  mintAddress: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    stats?: Record<string, number>;
    achievements?: Record<string, number>;
    badges?: {
      earned: string[];
      progress: Record<string, number>;
    };
  };
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
        console.log('Found NFTs:', myNfts);

        const nftData = await Promise.all(
          myNfts.map(async (nft) => {
            try {
              if (!nft.uri) {
                console.log('NFT URI가 없습니다:', nft);
                return null;
              }

              console.log('Fetching metadata for:', {
                name: nft.name,
                uri: nft.uri,
                address: nft.address.toString()
              });

              // 직접 NFT의 메타데이터 사용
              let imageUri = '';
              let metadata = null;
              
              // URI에서 메타데이터 가져오기
              try {
                console.log('URI에서 메타데이터 직접 가져오기 시도:', nft.uri);
                const response = await fetch(nft.uri);
                metadata = await response.json();
                console.log('URI에서 가져온 메타데이터:', metadata);
              } catch (error) {
                console.warn('Failed to fetch metadata from URI:', error);
              }

              // 이미지 URI 처리
              if (metadata?.image) {
                imageUri = metadata.image;
                if (imageUri.startsWith('ipfs://')) {
                  imageUri = `https://ipfs.io/ipfs/${imageUri.substring(7)}`;
                } else if (imageUri.startsWith('ar://')) {
                  imageUri = `https://arweave.net/${imageUri.substring(5)}`;
                } else if (!imageUri.startsWith('http')) {
                  imageUri = `https://arweave.net/${imageUri}`;
                }
              } else if (nft.json?.image) {
                imageUri = nft.json.image;
                if (imageUri.startsWith('ipfs://')) {
                  imageUri = `https://ipfs.io/ipfs/${imageUri.substring(7)}`;
                } else if (imageUri.startsWith('ar://')) {
                  imageUri = `https://arweave.net/${imageUri.substring(5)}`;
                } else if (!imageUri.startsWith('http')) {
                  imageUri = `https://arweave.net/${imageUri}`;
                }
              }

              // 이미지 URI가 없는 경우 기본 이미지 사용
              if (!imageUri) {
                imageUri = 'https://placehold.co/600x400?text=No+Image';
              }

              const nftData = {
                name: metadata?.name || nft.name || 'Unnamed NFT',
                image: imageUri,
                description: metadata?.description || nft.json?.description || '',
                mintAddress: nft.address.toString(),
                attributes: metadata?.attributes || nft.json?.attributes || [],
                properties: metadata?.properties || nft.json?.properties || {}
              };

              // 메타데이터가 없는 경우 기본값 설정
              if (!nftData.description) {
                nftData.description = `${nftData.attributes?.find(attr => attr.trait_type === 'Repetitions')?.value || 0}회 스쿼트 챌린지를 완료하여 획득한 NFT입니다.`;
              }

              console.log('최종 NFT 데이터:', nftData);
              return nftData as NFT;
            } catch (error) {
              console.error('Error processing NFT:', error);
              console.error('NFT:', nft);
              return null;
            }
          })
        );

        const validNfts = nftData.filter((nft): nft is NFT => nft !== null);
        console.log('Valid NFTs:', validNfts);
        setNfts(validNfts);
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
                    <div className="relative w-full h-48 mb-4">
                      <img 
                        src={nft.image} 
                        alt={nft.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                        }}
                      />
                    </div>
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
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedNft(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg max-w-4xl w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
              onClick={() => setSelectedNft(null)}
            >
              ✕
            </button>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* 이미지 섹션 */}
              <div className="md:w-1/2">
                <div className="relative rounded-lg overflow-hidden bg-black/20">
                  <img 
                    src={selectedNft.image} 
                    alt={selectedNft.name}
                    className="w-full h-auto rounded-lg" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                    }}
                  />
                </div>
              </div>
              
              {/* 정보 섹션 */}
              <div className="md:w-1/2 space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h2 className="text-3xl font-bold mb-2 gradient-text">{selectedNft.name}</h2>
                  <p className="text-gray-400">{selectedNft.description || '설명이 없습니다.'}</p>
                </div>

                {/* NFT 정보 */}
                <div className="bg-black/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">NFT 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">소유자</span>
                      <span className="font-medium">{wallet.publicKey?.toString().slice(0, 4)}...{wallet.publicKey?.toString().slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">네트워크</span>
                      <span className="font-medium">Devnet</span>
                    </div>
                  </div>
                </div>
                
                {/* 운동 기록 */}
                <div className="bg-black/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">운동 기록</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400">
                          <th className="pb-2">날짜</th>
                          <th className="pb-2">스쿼트 횟수</th>
                          <th className="pb-2">운동 시간</th>
                          <th className="pb-2">측정 방식</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNft.attributes && selectedNft.attributes.map((attr, idx) => {
                          if (attr.trait_type === 'Achievement Date' || attr.trait_type === 'Korean Time') {
                            let formattedDate;
                            if (attr.trait_type === 'Korean Time') {
                              formattedDate = attr.value;
                            } else {
                              const date = new Date(attr.value);
                              formattedDate = new Intl.DateTimeFormat('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Seoul'
                              }).format(date);
                            }

                            const repetitions = selectedNft.attributes?.find(a => 
                              a.trait_type.toLowerCase().includes('repetitions')
                            )?.value || '0';

                            const exerciseDuration = selectedNft.attributes?.find(a => 
                              a.trait_type.toLowerCase().includes('exercise duration')
                            )?.value || '0';

                            return (
                              <tr key={idx} className="border-t border-gray-700">
                                <td className="py-2 text-white">{formattedDate}</td>
                                <td className="py-2 text-white">{repetitions}회</td>
                                <td className="py-2 text-white">{exerciseDuration}초</td>
                                <td className="py-2 text-white">자세 인식</td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 특성 */}
                {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                  <div className="bg-black/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">특성</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedNft.attributes.map((attr, idx) => {
                        const isImportant = ['횟수', '등급', 'count', 'level', 'grade', 'repetitions', 'achievement level'].includes(attr.trait_type.toLowerCase());
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg transition-colors ${
                              isImportant 
                                ? 'bg-blue-900/30 hover:bg-blue-900/40 border border-blue-500/30' 
                                : 'bg-black/30 hover:bg-black/40'
                            }`}
                          >
                            <div className="text-sm text-gray-400">{attr.trait_type}</div>
                            <div className={`font-medium ${isImportant ? 'text-blue-400' : 'text-white'}`}>
                              {attr.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 민트 주소 */}
                <div className="bg-black/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">민트 주소</h3>
                  <div className="break-all">
                    <a 
                      href={`https://explorer.solana.com/address/${selectedNft.mintAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {selectedNft.mintAddress}
                    </a>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 pt-4">
                  <a 
                    href={`https://explorer.solana.com/address/${selectedNft.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1 text-center py-3"
                  >
                    Explorer에서 보기
                  </a>
                  <button 
                    onClick={() => setSelectedNft(null)}
                    className="btn-secondary flex-1 py-3"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 