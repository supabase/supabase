/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        module: false,
      },
    }
    return config
  },
  swcMinify: false,
}

export default nextConfig
