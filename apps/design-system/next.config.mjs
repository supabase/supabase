import { withContentlayer } from 'next-contentlayer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'ui-patterns', 'common', 'shared-data', 'icons'],
}

export default withContentlayer(nextConfig)
