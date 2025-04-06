# Squat NFT DApp (스쿼트 NFT DApp)

[English](#english) | [한글](#korean)

## English

### Overview
Squat NFT DApp is a web application that mints NFTs based on your squat exercise performance. Using PoseNet for motion detection, it tracks your squats and rewards you with unique NFTs on the Solana blockchain.

### Features
- Real-time squat detection using PoseNet
- Automatic squat counting
- NFT minting based on exercise achievements
- Achievement levels (Bronze, Silver, Gold)
- Wallet integration with Phantom
- NFT gallery to view your collected NFTs

### Tech Stack
- Frontend: Next.js, React, TailwindCSS
- Blockchain: Solana, Metaplex
- Motion Detection: TensorFlow.js, PoseNet
- Wallet: Phantom Wallet

### Getting Started

1. Clone the repository
```bash
git clone https://github.com/Youngkwon-Lee/sol_dapp_squat.git
cd sol_dapp_squat
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (optional)
```bash
cp .env.example .env
```
Edit `.env` file if you want to use a custom RPC endpoint:
- `RPC_ENDPOINT`: Solana RPC endpoint (default: devnet)
- `PRIVATE_KEY`: (For developers only) Your Solana wallet private key for uploading NFT metadata

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### NFT Minting Process

#### For Developers
1. Prepare NFT assets:
   - Place your NFT image in `public/nft-image.svg`
   - Update metadata template in `metadata.json`

2. Upload NFT assets to Arweave:
```bash
# Make sure PRIVATE_KEY is set in .env
npm run upload-nft-assets
```
This will generate `nft-config.json` with the uploaded URIs.

3. Update the NFT URI in `app/components/NFTMinter.tsx`:
```typescript
const NFT_CONFIG = {
  name: "Squat Challenge NFT",
  symbol: "SQUAT",
  uri: "YOUR_METADATA_URI_HERE", // Update this with the URI from nft-config.json
};
```

#### For Users
1. Install Phantom Wallet browser extension
2. Switch to Solana Devnet in Phantom:
   - Open Phantom wallet
   - Click settings (⚙️)
   - Go to Change Network
   - Select "Devnet"

3. Get some Devnet SOL:
   - Visit [Solana Faucet](https://solfaucet.com)
   - Enter your wallet address
   - Click "Devnet"

4. Using the DApp:
   - Connect your Phantom wallet
   - Start doing squats
   - Complete 30 squats to unlock NFT minting
   - Click "NFT 발행하기" button
   - Approve the transaction in Phantom
   - View your NFT in the gallery

### Usage
1. Connect your Phantom wallet
2. Start the squat exercise
3. Complete the required number of squats
4. Mint your achievement NFT
5. View your NFTs in the gallery

### License
MIT License

---

## Korean

### 개요
스쿼트 NFT DApp은 스쿼트 운동 성과를 기반으로 NFT를 발행하는 웹 애플리케이션입니다. PoseNet을 사용하여 동작을 감지하고, 스쿼트 횟수를 추적하여 솔라나 블록체인에서 고유한 NFT를 보상으로 제공합니다.

### 주요 기능
- PoseNet을 이용한 실시간 스쿼트 동작 감지
- 자동 스쿼트 카운팅
- 운동 성과에 따른 NFT 발행
- 성취 레벨 (브론즈, 실버, 골드)
- Phantom 지갑 연동
- 보유한 NFT를 확인할 수 있는 갤러리

### 기술 스택
- 프론트엔드: Next.js, React, TailwindCSS
- 블록체인: Solana, Metaplex
- 동작 감지: TensorFlow.js, PoseNet
- 지갑: Phantom Wallet

### 시작하기

1. 저장소 클론
```bash
git clone https://github.com/Youngkwon-Lee/sol_dapp_squat.git
cd sol_dapp_squat
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정 (선택사항)
```bash
cp .env.example .env
```
커스텀 RPC 엔드포인트를 사용하려면 `.env` 파일을 수정하세요:
- `RPC_ENDPOINT`: 솔라나 RPC 엔드포인트 (기본값: devnet)
- `PRIVATE_KEY`: (개발자용) NFT 메타데이터 업로드를 위한 솔라나 지갑 비밀키

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### NFT 민팅 프로세스

#### 개발자용
1. NFT 에셋 준비:
   - NFT 이미지를 `public/nft-image.svg`에 저장
   - `metadata.json`에서 메타데이터 템플릿 업데이트

2. NFT 에셋을 Arweave에 업로드:
```bash
# .env 파일에 PRIVATE_KEY가 설정되어 있어야 합니다
npm run upload-nft-assets
```
이 과정에서 `nft-config.json` 파일이 생성되며 업로드된 URI가 저장됩니다.

3. `app/components/NFTMinter.tsx`에서 NFT URI 업데이트:
```typescript
const NFT_CONFIG = {
  name: "Squat Challenge NFT",
  symbol: "SQUAT",
  uri: "YOUR_METADATA_URI_HERE", // nft-config.json에서 얻은 URI로 업데이트
};
```

#### 사용자용
1. Phantom Wallet 브라우저 확장 프로그램 설치
2. Phantom에서 Solana Devnet으로 전환:
   - Phantom 지갑 열기
   - 설정(⚙️) 클릭
   - Change Network 선택
   - "Devnet" 선택

3. Devnet SOL 받기:
   - [Solana Faucet](https://solfaucet.com) 방문
   - 지갑 주소 입력
   - "Devnet" 클릭

4. DApp 사용하기:
   - Phantom 지갑 연결
   - 스쿼트 운동 시작
   - 30회 스쿼트 완료하여 NFT 민팅 잠금 해제
   - "NFT 발행하기" 버튼 클릭
   - Phantom에서 트랜잭션 승인
   - 갤러리에서 NFT 확인

### 사용 방법
1. Phantom 지갑 연결
2. 스쿼트 운동 시작
3. 목표 스쿼트 횟수 달성
4. 성과 NFT 발행
5. 갤러리에서 NFT 확인

### 라이선스
MIT 라이선스 