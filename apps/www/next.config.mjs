import { remarkCodeHike } from '@code-hike/mdx'
import bundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'
import { withSentryConfig } from '@sentry/nextjs'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import redirects from './lib/redirects.js'
import remotePatterns from './lib/remotePatterns.js'
import rewrites from './lib/rewrites.js'

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      [
        remarkCodeHike,
        {
          theme: codeHikeTheme,
          lineNumbers: true,
          showCopyButton: true,
        },
      ],
      remarkGfm,
    ],
    rehypePlugins: [rehypeSlug],
    // This is required for `MDXProvider` component
    providerImportSource: '@mdx-js/react',
  },
})

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: '',
  assetPrefix: getAssetPrefix(),
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: false,
  transpilePackages: [
    'ui',
    'ui-patterns',
    'common',
    'shared-data',
    'icons',
    'api-types',
    'marketing',
    // needed to make the octokit packages work in /changelog
    '@octokit/plugin-paginate-graphql',
  ],
  experimental: {
    // needed to make the octokit packages work in /changelog
    esmExternals: 'loose',
  },
  /**
   * Exclude huge directories from being traced into serverless functions
   * to avoid the max size limit for Serverless Functions on Vercel:
   * https://vercel.com/guides/troubleshooting-function-250mb-limit
   */
  outputFileTracingExcludes: {
    '*': [
      // Next.js build artifacts
      '.next/cache/**/*',
      '.next/static/**/*',
      // Static assets
      'public/**/*',
    ],
  },
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/changelog-rss.xml',
        headers: [
          { key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, s-maxage=900, stale-while-revalidate=900' },
        ],
      },
      {
        source: '/changelog-rss/:slug.xml',
        headers: [
          { key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, s-maxage=900, stale-while-revalidate=900' },
        ],
      },
      {
        source: '/changelog/:slug.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, s-maxage=900, stale-while-revalidate=900' },
          { key: 'Vary', value: 'Accept' },
        ],
      },
      {
        source: '/changelog.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, s-maxage=900, stale-while-revalidate=900' },
          { key: 'Vary', value: 'Accept' },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</.well-known/api-catalog>; rel="api-catalog"',
          },
        ],
      },
      {
        source: '/.well-known/api-catalog',
        headers: [
          { key: 'content-type', value: 'application/linkset+json' },
          { key: 'access-control-allow-origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/vercel/flags',
        headers: [
          {
            key: 'content-type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/favicon/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=86400' }],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value:
              process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' && process.env.VERCEL === '1'
                ? 'max-age=31536000; includeSubDomains; preload'
                : '',
          },
        ],
      },
      {
        source: '/(docs|blog)/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
      {
        source: '/enterprise-terms',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return rewrites
  },
  async redirects() {
    // For /docs/guides/ redirects, auto-generate .md variants so renamed/deleted pages
    // redirect correctly when fetched as markdown
    const docsMdRedirects = redirects
      .filter(
        (r) =>
          r.source.startsWith('/docs/guides/') &&
          typeof r.destination === 'string' &&
          r.destination.startsWith('/')
      )
      .map((r) => ({ ...r, source: `${r.source}.md`, destination: `${r.destination}.md` }))

    return [...docsMdRedirects, ...redirects]
  },
  typescript: {
    // On previews, typechecking is run via GitHub Action only for efficiency
    // On production, we turn it on to prevent errors from conflicting PRs getting into
    // prod
    ignoreBuildErrors: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? false : true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel.
    ignoreDuringBuilds: true,
  },
}

// next.config.js.
const configExport = () => {
  const plugins = [withMDX, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}

export default withSentryConfig(configExport, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'supabase',
  project: 'www',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
})

function getAssetPrefix() {
  // If not force enabled, but not production env, disable CDN
  if (process.env.FORCE_ASSET_CDN !== '1' && process.env.VERCEL_ENV !== 'production') {
    return undefined
  }

  // Force disable CDN
  if (process.env.FORCE_ASSET_CDN === '-1') {
    return undefined
  }

  return `https://frontend-assets.supabase.com/${process.env.SITE_NAME}/${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 12)}`
}
