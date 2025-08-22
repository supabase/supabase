import bundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'
import { withSentryConfig } from '@sentry/nextjs'

import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import redirects from './lib/redirects.js'
import remotePatterns from './lib/remotePatterns.js'
import rewrites from './lib/rewrites.js'

import { remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }

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
    // needed to make the octokit packages work in /changelog
    '@octokit/plugin-paginate-graphql',
  ],
  experimental: {
    // needed to make the octokit packages work in /changelog
    esmExternals: 'loose',
    // Optimize bundle sizes
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  // Exclude huge directories from being traced into serverless functions
  outputFileTracingExcludes: {
    '*': [
      // Build-time only dependencies
      // 'node_modules/@swc/**/*',
      // 'node_modules/@esbuild/**/*',
      // 'node_modules/rollup/**/*',
      // // 'node_modules/webpack/**/*',
      // 'node_modules/terser/**/*',
      // // 'node_modules/@babel/**/*',
      // 'node_modules/typescript/**/*',
      // 'node_modules/@types/**/*',
      // // Next.js build artifacts
      // '.next/cache/**/*',
      // '.next/static/**/*',
      // // '.next/server/**/*.js.map',
      // '.next/trace',
      // // Static assets
      'public/**/*',
      // // Test and story files
      // 'components/**/*.stories.*',
      // 'components/**/*.test.*',
      // '**/*.test.*',
      // '**/*.spec.*',
      // '**/*.stories.*',
      // // Cache directories
      // '**/node_modules/.cache/**/*',
      // // Build-time Sentry plugin only
      // '**/node_modules/@sentry/webpack-plugin/**/*',
      // // Large optional dependencies
      // '**/node_modules/framer-motion/**/*',
    ],
    // More conservative exclusions for blog pages
    '/blog/**/*': ['public/**/*', '.next/static/**/*'],
  },
  // Additional optimizations for smaller serverless functions
  serverExternalPackages: [],
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns,
  },
  async headers() {
    return [
      // Allow CMS preview iframe embedding by omitting X-Frame-Options for blog routes
      {
        source: '/blog/:slug*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          // No X-Frame-Options header to allow iframe embedding
        ],
      },
      {
        source: '/api-v2/cms/preview',
        headers: [
          {
            key: 'content-type',
            value: 'text/html',
          },
          // No X-Frame-Options header to allow iframe embedding
        ],
      },
      // Default X-Frame-Options for all other paths
      {
        source: '/((?!blog|api-v2/cms/preview).*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
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
    ]
  },
  async rewrites() {
    return rewrites
  },
  async redirects() {
    return redirects
  },
  typescript: {
    // WARNING: production builds can successfully complete even there are type errors
    // Typechecking is checked separately via .github/workflows/typecheck.yml
    ignoreBuildErrors: true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __SENTRY_DEBUG__: false,
        __SENTRY_TRACING__: false,
        __RRWEB_EXCLUDE_IFRAME__: true,
        __RRWEB_EXCLUDE_SHADOW_DOM__: true,
        __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
      })
    )
    // return the modified config
    return config
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
