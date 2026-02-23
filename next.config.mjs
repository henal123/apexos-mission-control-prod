/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  publicRuntimeConfig: {
    OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL || 'wss://henal-open-claw.duckdns.org',
  },
};

export default nextConfig;
