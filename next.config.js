/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["argon2", "mysql2"],
  },
};

module.exports = nextConfig;

