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

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` file with your credentials:
- `PRIVATE_KEY`: Your Solana wallet private key
- `RPC_ENDPOINT`: Solana RPC endpoint (default: devnet)

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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

3. 환경 변수 설정
```bash
cp .env.example .env
```
`.env` 파일에 다음 정보를 입력하세요:
- `PRIVATE_KEY`: 솔라나 지갑 비밀키
- `RPC_ENDPOINT`: 솔라나 RPC 엔드포인트 (기본값: devnet)

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 사용 방법
1. Phantom 지갑 연결
2. 스쿼트 운동 시작
3. 목표 스쿼트 횟수 달성
4. 성과 NFT 발행
5. 갤러리에서 NFT 확인

### 라이선스
MIT 라이선스 