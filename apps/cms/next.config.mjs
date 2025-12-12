import { withPayload } from '@payloadcms/next/withPayload'

const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  const redirects = [internetExplorerRedirect]

  return redirects
}

const WWW_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
        typeof process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL === 'string'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL.replace('cms-git-', 'zone-www-dot-com-git-')}`
      : 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[WWW_SITE_ORIGIN /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol?.replace(':', ''),
        }
      }),
    ],
  },
  reactStrictMode: true,
  redirects,
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel
    ignoreDuringBuilds: true,
  },
  // Configure Sharp as an external package for server-side rendering
  serverExternalPackages: ['sharp'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
