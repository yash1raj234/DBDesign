/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monaco Editor ships large assets; prevent Next from trying to SSR them
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "monaco-editor": false,
    };
    return config;
  },
};

export default nextConfig;
