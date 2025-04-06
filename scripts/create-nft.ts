import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
  percentAmount,
  generateSigner,
  publicKey,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const createSquatNft = async () => {
  console.log('NFT 생성을 시작합니다...');

  // Umi 설정
  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplTokenMetadata())
    .use(irysUploader());

  // 환경 변수에서 비밀키 가져오기
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY가 설정되지 않았습니다.');
  }
  
  const secretKey = bs58.decode(process.env.PRIVATE_KEY);
  const keypair = Keypair.fromSecretKey(secretKey);
  
  umi.use(signerIdentity(createSignerFromKeypair(umi, {
    publicKey: publicKey(keypair.publicKey.toBase58()),
    secretKey: Uint8Array.from(secretKey),
  })));

  // 이미지 업로드
  console.log('이미지를 업로드합니다...');
  const imageFile = fs.readFileSync(
    path.join(process.cwd(), 'public', 'nft-image.svg')
  );

  const umiImageFile = createGenericFile(imageFile, 'nft-image.svg', {
    tags: [{ name: 'Content-Type', value: 'image/svg+xml' }],
  });

  const imageUri = await umi.uploader.upload([umiImageFile]);
  console.log('이미지 URI:', imageUri[0]);

  // 메타데이터 생성 및 업로드
  console.log('메타데이터를 생성합니다...');
  const currentDate = new Date();
  const koreanTime = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(currentDate);

  const squatCount = 30;
  const caloriesBurned = Math.round(squatCount * 0.32); // 스쿼트 1회당 약 0.32칼로리
  const exerciseDuration = Math.round(squatCount / 20 * 60); // 초당 3회 기준
  
  const metadata = {
    name: 'Squat Challenge NFT',
    symbol: 'SQUAT',
    description: `${koreanTime}에 ${squatCount}회 스쿼트 챌린지를 완료하여 획득한 NFT입니다.`,
    image: imageUri[0],
    attributes: [
      {
        trait_type: 'Challenge Type',
        value: 'Daily Squat'
      },
      {
        trait_type: 'Repetitions',
        value: squatCount
      },
      {
        trait_type: 'Achievement Level',
        value: squatCount >= 100 ? 'Gold' : squatCount >= 50 ? 'Silver' : 'Bronze'
      },
      {
        trait_type: 'Achievement Date',
        value: currentDate.toISOString()
      },
      {
        trait_type: 'Korean Time',
        value: koreanTime
      },
      {
        trait_type: 'Calories Burned',
        value: caloriesBurned
      },
      {
        trait_type: 'Exercise Duration',
        value: `${exerciseDuration} seconds`
      },
      {
        trait_type: 'Squats Per Minute',
        value: Math.round((squatCount / exerciseDuration) * 60)
      }
    ],
    properties: {
      files: [
        {
          uri: imageUri[0],
          type: 'image/svg+xml'
        }
      ],
      category: 'image',
      creators: [
        {
          address: umi.identity.publicKey,
          share: 100
        }
      ],
      stats: {
        total_squats: squatCount,
        calories_burned: caloriesBurned,
        exercise_duration_seconds: exerciseDuration,
        achievement_timestamp: currentDate.getTime()
      },
      achievements: {
        current_level: squatCount >= 100 ? 'Gold' : squatCount >= 50 ? 'Silver' : 'Bronze',
        next_level: squatCount >= 100 ? 'Master' : squatCount >= 50 ? 'Gold' : 'Silver',
        squats_for_next_level: squatCount >= 100 ? '∞' : squatCount >= 50 ? (100 - squatCount) : (50 - squatCount)
      }
    }
  };

  console.log('메타데이터를 업로드합니다...');
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log('메타데이터 URI:', metadataUri);

  // NFT 민팅
  console.log('NFT를 민팅합니다...');
  const mint = generateSigner(umi);
  const { signature } = await createNft(umi, {
    mint,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);

  // 결과 출력
  console.log('\nNFT가 생성되었습니다!');
  console.log('트랜잭션 확인 (Solana Explorer):');
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('\nNFT 주소:');
  console.log(mint.publicKey);
};

createSquatNft().catch((error) => {
  console.error('에러 발생:', error);
  process.exit(1);
}); 