import { withContentlayer } from 'next-contentlayer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons'],
}

export default withContentlayer(nextConfig)
