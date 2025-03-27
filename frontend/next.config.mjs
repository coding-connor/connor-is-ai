/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      timeout: 300, // 5 minutes in seconds
    },
  },
};

export default nextConfig;
