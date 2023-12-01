/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'ui-patterns'],
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
}

module.exports = nextConfig
