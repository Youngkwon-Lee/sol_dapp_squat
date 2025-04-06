/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RPC_ENDPOINT: process.env.RPC_ENDPOINT
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  }
}

module.exports = nextConfig 