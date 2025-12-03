/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    POLYMARKET_API_KEY: process.env.POLYMARKET_API_KEY,
    POLYMARKET_SECRET: process.env.POLYMARKET_SECRET,
    POLYMARKET_PASSPHRASE: process.env.POLYMARKET_PASSPHRASE,
    POLYMARKET_POLY_ADDRESS: process.env.POLYMARKET_POLY_ADDRESS,
  },
};

module.exports = nextConfig;

