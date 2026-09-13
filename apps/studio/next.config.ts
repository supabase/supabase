/* eslint-disable no-restricted-exports */

import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

import { getCSP } from './csp'
import {
  getMaintenanceRedirects,
  PLATFORM_REDIRECTS,
  SELF_HOSTED_REDIRECTS,
  SHARED_REDIRECTS,
} from './redirects.shared'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
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

  const SUPABASE_ASSETS_URL =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? 'https://frontend-assets.supabase.green'
      : 'https://frontend-assets.supabase.com'

  return `${SUPABASE_ASSETS_URL}/${process.env.SITE_NAME}/${process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 12) ?? 'unknown'}`
}

const marketplaceApiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL
  ? new URL(process.env.NEXT_PUBLIC_MARKETPLACE_API_URL)
  : null

const marketplaceApiProtocol: 'http' | 'https' | null =
  marketplaceApiUrl?.protocol === 'https:'
    ? 'https'
    : marketplaceApiUrl?.protocol === 'http:'
      ? 'http'
      : null

// Use `satisfies` instead of `: NextConfig` so TypeScript preserves narrow
// inferred types (e.g. async headers → Promise). This avoids TS2345 when
// wrapper functions (bundle-analyzer, sentry) resolve their `next` peer
// types to a different major version than studio's own next dependency.
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: getAssetPrefix(),
  output: 'standalone',
  experimental: {
    clientRouterFilter: false,
  },
  async rewrites() {
    return [
      {
        source: `/.well-known/vercel/flags`,
        destination: `https://supabase.com/.well-known/vercel/flags`,
        basePath: false as const,
      },
    ]
  },
  async redirects() {
    // Rules live in `redirects.shared.ts` (shared with `vercel.ts`). Next
    // auto-prepends `basePath` to source and destination on its own,
    // except for the special `/` → basePath bounce below which opts out
    // via `basePath: false`.
    const isPlatform = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
    const maintenance = process.env.MAINTENANCE_MODE === 'true'
    return [
      ...(isPlatform ? PLATFORM_REDIRECTS : SELF_HOSTED_REDIRECTS),
      ...SHARED_REDIRECTS,
      ...(process.env.NEXT_PUBLIC_BASE_PATH?.length
        ? [
            {
              source: '/',
              destination: process.env.NEXT_PUBLIC_BASE_PATH,
              basePath: false as const,
              permanent: false,
            },
          ]
        : []),
      ...getMaintenanceRedirects(maintenance),
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*?)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value:
              process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' && process.env.VERCEL === '1'
                ? 'max-age=31536000; includeSubDomains; preload'
                : '',
          },
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ? getCSP() : "frame-ancestors 'none';",
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
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
        source: '/img/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=2592000' }],
      },
      {
        source: '/favicon/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=86400' }],
      },
      {
        source: '/(.*).ts',
        headers: [{ key: 'content-type', value: 'text/typescript' }],
      },
    ]
  },
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/*',
      },
      {
        protocol: 'https',
        hostname: 'api-frameworks.vercel.sh',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'vercel.com',
        port: '',
        pathname: '**',
      },
      ...(marketplaceApiUrl
        ? [
            {
              ...(marketplaceApiProtocol ? { protocol: marketplaceApiProtocol } : {}),
              hostname: marketplaceApiUrl.hostname,
              port: marketplaceApiUrl.port,
              pathname: '**',
            },
          ]
        : []),
    ],
  },
  transpilePackages: ['ui', 'ui-patterns', 'common', 'shared-data', 'api-types', 'icons'],
  serverExternalPackages: ['libpg-query'],
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      // special case for Deno libs to be loaded as a raw text. They're passed as raw text to the Monaco editor.
      'edge-runtime.d.ts': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      'lib.deno.d.ts': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  onDemandEntries: {
    maxInactiveAge: 24 * 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
  typescript: {
    // Typechecking is run via GitHub Action only for efficiency
    // For production, we run typechecks separate from the build command (pnpm typecheck && pnpm build)
    ignoreBuildErrors: true,
  },
} satisfies NextConfig

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
const platformConfig =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig

export default process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' && process.env.VERCEL === '1'
  ? withSentryConfig(platformConfig, {
      silent: true,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Automatically annotate React components to show their full name in breadcrumbs and session replay
      reactComponentAnnotation: {
        enabled: true,
      },

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,

      // Annotate bundles at build time so thirdPartyErrorFilterIntegration can
      // distinguish our code from browser extensions / injected scripts at runtime.
      unstable_sentryWebpackPluginOptions: {
        applicationKey: 'supabase-studio',
      },
    })
  : platformConfig
