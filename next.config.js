/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RPC_ENDPOINT: process.env.RPC_ENDPOINT
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // WASM 파일 처리를 위한 설정
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // 노드 폴리필 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  }
}

module.exports = nextConfig 