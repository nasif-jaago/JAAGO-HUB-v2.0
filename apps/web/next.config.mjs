/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  transpilePackages: [
    "@jaago/shared-types",
    "@jaago/validation",
    "@jaago/api-client",
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
