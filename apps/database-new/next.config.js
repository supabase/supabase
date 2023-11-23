/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  transpilePackages: ['ui'],
  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: 'nextjs-node-loader',
          options: {
            includeWebpackPublicPath: false,
            outputPath: config.output.path,
          },
        },
      ],
    })
    return config
  },
  redirects: () => [
    {
      source: '/',
      destination: '/new',
      permanent: true,
    },
  ],
}

module.exports = nextConfig
