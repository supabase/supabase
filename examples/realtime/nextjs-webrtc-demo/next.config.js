/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/room',
      },
    ]
  },
  reactStrictMode: true,
}

module.exports = nextConfig
