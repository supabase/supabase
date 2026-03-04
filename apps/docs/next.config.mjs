// @ts-check
import configureBundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'
import { withSentryConfig } from '@sentry/nextjs'
import withYaml from 'next-plugin-yaml'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { parse as parseToml } from 'smol-toml'
import remotePatterns from './lib/remotePatterns.js'

const withBundleAnalyzer = configureBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    providerImportSource: '@mdx-js/react',
  },
})

/** @type {import('next').NextConfig} nextConfig */
const nextConfig = {
  assetPrefix: getAssetPrefix(),
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // reactStrictMode: true,
  // swcMinify: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/docs',
  images: {
    dangerouslyAllowSVG: false,
    // @ts-ignore
    remotePatterns,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.include$/,
      type: 'asset/source',
    })
    config.module.rules.push({
      test: /\.toml$/,
      type: 'json',
      parser: {
        parse: parseToml,
      },
    })
    return config
  },
  transpilePackages: [
    'ui',
    'ui-patterns',
    'common',
    'dayjs',
    'shared-data',
    'api-types',
    'icons',
    'next-mdx-remote',
  ],
  outputFileTracingIncludes: {
    '/api/crawlers': ['./features/docs/generated/**/*', './docs/ref/**/*'],
    '/guides/**/*': ['./content/guides/**/*', './content/troubleshooting/**/*', './examples/**/*'],
    '/reference/**/*': ['./features/docs/generated/**/*', './docs/ref/**/*'],
  },
  serverExternalPackages: ['libpg-query', 'twoslash'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: process.env.VERCEL === '1' ? 'max-age=31536000; includeSubDomains; preload' : '',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'supabase.com',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: process.env.VERCEL === '1' ? 'max-age=31536000; includeSubDomains; preload' : '',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
        has: [
          {
            type: 'host',
            value: '(?:.+\\.vercel\\.app)',
          },
        ],
      },
      {
        source: '/favicon/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=86400' }],
      },
    ]
  },

  /**
   * Doc rewrites and redirects are
   * handled by the `www` nextjs config:
   *
   * ./apps/www/lib/redirects.js
   *
   * Only add dev/preview specific redirects
   * in this config.
   */
  async redirects() {
    return [
      // Redirect root to docs base path in dev/preview envs
      {
        source: '/',
        destination: '/docs',
        basePath: false,
        permanent: false,
      },

      // Redirect dashboard links in dev/preview envs
      {
        source: '/dashboard/:path*',
        destination: 'https://supabase.com/dashboard/:path*',
        basePath: false,
        permanent: false,
      },

      // Redirect blog links in dev/preview envs
      {
        source: '/blog/:path*',
        destination: 'https://supabase.com/blog/:path*',
        basePath: false,
        permanent: false,
      },
    ]
  },
  typescript: {
    // On previews, typechecking is run via GitHub Action only for efficiency
    // On production, we turn it on to prevent errors from conflicting PRs getting into
    // prod
    ignoreBuildErrors: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? false : true,
  },
}

const configExport = () => {
  const plugins = [withMDX, withYaml, withBundleAnalyzer]
  // @ts-ignore
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}

export default withSentryConfig(configExport, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'supabase',
  project: 'docs',

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

  // @ts-ignore
  return `https://frontend-assets.supabase.com/${process.env.SITE_NAME}/${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 12)}`
}
