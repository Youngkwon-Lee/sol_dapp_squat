import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { createGenericFile, generateSigner, keypairIdentity, sol } from "@metaplex-foundation/umi";
import { clusterApiUrl } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import path from "path";
import fs from "fs";

async function main() {
  // Umi 인스턴스 생성
  const umi = createUmi(clusterApiUrl("devnet"))
    .use(irysUploader({
      address: "https://devnet.irys.xyz",
      timeout: 60000,
      providerUrl: "https://api.devnet.solana.com",
      priceMultiplier: 1,
      uploadPrice: sol(0.01) // 0.01 SOL로 설정
    }));

  // Umi 서명자 생성
  const signer = generateSigner(umi);
  
  // 서명자 설정
  umi.use(keypairIdentity(signer));

  // Irys 업로더에 SOL 충전
  console.log("Irys 업로더에 SOL 충전 중...");
  await umi.uploader.fund(0.1); // 0.1 SOL 충전
  console.log("Irys 업로더 충전 완료");

  // 임시 키페어 생성 (테스트용)
  const keypair = Keypair.generate();
  
  // 이미지 파일 읽기
  const imageBuffer = fs.readFileSync(path.join(process.cwd(), "public", "nft-image.svg"));
  const imageFile = createGenericFile(imageBuffer, "nft-image.svg", {
    contentType: "image/svg+xml",
  });

  console.log("이미지 업로드 중...");
  const [imageUri] = await umi.uploader.upload([imageFile]);
  console.log("이미지 업로드 완료:", imageUri);

  // 현재 시간 정보
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toISOString();
  const koreanTime = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  // 획득한 배지 목록 (예시)
  const earnedBadges = [
    "첫 챌린지 완료",  // 첫 번째 챌린지 완료
    "정시 운동가",     // 같은 시간대에 운동
    "3일 연속 달성",   // 3일 연속 달성
    "자세 마스터"      // 정확한 자세로 수행
  ];

  // NFT 메타데이터 생성
  const metadata = {
    name: "Squat Challenge NFT",
    symbol: "SQUAT",
    description: `30회 스쿼트 챌린지를 완료하여 획득한 NFT입니다!\n달성 시각: ${koreanTime}\n\n🏆 획득한 배지:\n${earnedBadges.map(badge => `- ${badge}`).join('\n')}`,
    image: imageUri,
    attributes: [
      {
        trait_type: "Challenge",
        value: "Squat"
      },
      {
        trait_type: "Repetitions",
        value: "30"
      },
      {
        trait_type: "Achievement Date",
        value: dateStr
      },
      {
        trait_type: "Timestamp",
        value: timestamp
      },
      {
        trait_type: "Achievement Level",
        value: "Bronze"  // 30회: Bronze, 50회: Silver, 100회: Gold
      },
      {
        trait_type: "Calories Burned",
        value: "100"  // 예상 소모 칼로리
      },
      {
        trait_type: "Exercise Duration",
        value: "10"  // 예상 운동 시간(분)
      },
      {
        trait_type: "Challenge Type",
        value: "Daily"
      },
      {
        trait_type: "Streak",
        value: "3"  // 연속 달성 일수
      },
      {
        trait_type: "Community Ranking",
        value: "상위 10%"  // 커뮤니티 내 순위
      },
      {
        trait_type: "Total Participants",
        value: "1000"  // 전체 참여자 수
      },
      {
        trait_type: "Badges Count",
        value: earnedBadges.length.toString()
      }
    ],
    properties: {
      files: [
        {
          uri: imageUri,
          type: "image/svg+xml"
        }
      ],
      category: "image",
      // 추가 메타데이터
      stats: {
        calories_burned: 100,
        exercise_duration_minutes: 10,
        squats_per_minute: 3
      },
      achievements: {
        current_level: "Bronze",
        next_level: "Silver",
        squats_needed_for_next_level: 20,
        streak: {
          current: 3,
          best: 5,
          last_exercise_date: dateStr
        },
        community_stats: {
          ranking_percentile: 10,
          total_participants: 1000,
          ranking_position: 100
        }
      },
      badges: {
        earned: earnedBadges,
        available: [
          "7일 연속 달성",
          "30일 연속 달성",
          "새벽 운동가",
          "완벽한 페이스",
          "스쿼트 마스터"
        ],
        latest_earned: earnedBadges[earnedBadges.length - 1],
        total_earned: earnedBadges.length,
        progress: {
          "7일 연속 달성": "3/7",
          "30일 연속 달성": "3/30",
          "스쿼트 마스터": "30/100"
        }
      }
    }
  };

  console.log("메타데이터 업로드 중...");
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("메타데이터 업로드 완료:", metadataUri);

  // URI를 파일에 저장
  const config = {
    imageUri,
    metadataUri,
    metadata // 전체 메타데이터도 저장
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), "nft-config.json"),
    JSON.stringify(config, null, 2)
  );
  
  console.log("설정이 nft-config.json에 저장되었습니다.");
}

main().catch(console.error); 