/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
