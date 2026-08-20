/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
