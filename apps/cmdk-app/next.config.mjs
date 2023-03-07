// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   swcMinify: true,
// }

import withTM from 'next-transpile-modules'

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

// next.config.js.
export default () => {
  const plugins = [withTM(['ui', 'common'])]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
