import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  redirects: [
    {
      source: '/',
      destination: '/admin',
      permanent: true,
    },
  ],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
