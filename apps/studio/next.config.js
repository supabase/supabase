const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const { getCSP } = require('./csp')

// Required for nextjs standalone build
const path = require('path')

function getAssetPrefix() {
  // If not force enabled, but not production env, disable CDN
  if (process.env.FORCE_ASSET_CDN !== '1' && process.env.VERCEL_ENV !== 'production') {
    return undefined
  }

  // Force disable CDN
  if (process.env.FORCE_ASSET_CDN === '-1') {
    return undefined
  }

  return `${SUPABASE_ASSETS_URL}/${process.env.SITE_NAME}/${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 12)}`
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: getAssetPrefix(),
  output: 'standalone',
  experimental: {
    webpackBuildWorker: true,
  },
  async rewrites() {
    return [
      {
        source: `/.well-known/vercel/flags`,
        destination: `https://supabase.com/.well-known/vercel/flags`,
        basePath: false,
      },
    ]
  },
  async redirects() {
    return [
      ...(process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
        ? [
            {
              source: '/',
              has: [
                {
                  type: 'query',
                  key: 'next',
                  value: 'new-project',
                },
              ],
              destination: '/new/new-project',
              permanent: false,
            },
            {
              source: '/',
              destination: '/org',
              permanent: false,
            },
            {
              source: '/register',
              destination: '/sign-up',
              permanent: false,
            },
            {
              source: '/signup',
              destination: '/sign-up',
              permanent: false,
            },
            {
              source: '/signin',
              destination: '/sign-in',
              permanent: false,
            },
            {
              source: '/login',
              destination: '/sign-in',
              permanent: false,
            },
            {
              source: '/log-in',
              destination: '/sign-in',
              permanent: false,
            },
          ]
        : [
            {
              source: '/',
              destination: '/project/default',
              permanent: false,
            },
            {
              source: '/register',
              destination: '/project/default',
              permanent: false,
            },
            {
              source: '/signup',
              destination: '/project/default',
              permanent: false,
            },
            {
              source: '/signin',
              destination: '/project/default',
              permanent: false,
            },
            {
              source: '/login',
              destination: '/project/default',
              permanent: false,
            },
            {
              source: '/log-in',
              destination: '/project/default',
              permanent: false,
            },
          ]),
      {
        source: '/project/:ref/auth',
        destination: '/project/:ref/auth/users',
        permanent: true,
      },
      {
        source: '/project/:ref/database',
        destination: '/project/:ref/database/tables',
        permanent: true,
      },
      {
        source: '/project/:ref/database/graphiql',
        destination: '/project/:ref/api/graphiql',
        permanent: true,
      },
      {
        source: '/project/:ref/storage',
        destination: '/project/:ref/storage/buckets',
        permanent: true,
      },
      {
        source: '/project/:ref/settings',
        destination: '/project/:ref/settings/general',
        permanent: true,
      },
      {
        source: '/project/:ref/auth/settings',
        destination: '/project/:ref/auth/users',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'subscriptionPlan',
          },
        ],
        destination: '/org/_/billing?panel=subscriptionPlan',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'pitr',
          },
        ],
        destination: '/project/:ref/settings/addons?panel=pitr',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'computeInstance',
          },
        ],
        destination: '/project/:ref/settings/compute-and-disk',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'customDomain',
          },
        ],
        destination: '/project/:ref/settings/addons?panel=customDomain',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/subscription',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/project/:ref/database/api-logs',
        destination: '/project/:ref/logs/edge-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/database/postgres-logs',
        destination: '/project/:ref/logs/postgres-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/database/postgrest-logs',
        destination: '/project/:ref/logs/postgrest-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/database/pgbouncer-logs',
        destination: '/project/:ref/logs/pooler-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/logs/pgbouncer-logs',
        destination: '/project/:ref/logs/pooler-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/database/realtime-logs',
        destination: '/project/:ref/logs/realtime-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/storage/logs',
        destination: '/project/:ref/logs/storage-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/auth/logs',
        destination: '/project/:ref/logs/auth-logs',
        permanent: true,
      },
      {
        source: '/project/:ref/logs-explorer',
        destination: '/project/:ref/logs/explorer',
        permanent: true,
      },
      {
        source: '/project/:ref/sql/templates',
        destination: '/project/:ref/sql',
        permanent: true,
      },
      {
        source: '/org/:slug/settings',
        destination: '/org/:slug/general',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/update',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/update/free',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/update/pro',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/update/team',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/project/:ref/settings/billing/update/enterprise',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        permanent: true,
        source: '/project/:ref/reports/linter',
        destination: '/project/:ref/database/linter',
      },
      {
        permanent: true,
        source: '/project/:ref/reports/query-performance',
        destination: '/project/:ref/advisors/query-performance',
      },
      {
        permanent: true,
        source: '/project/:ref/database/query-performance',
        destination: '/project/:ref/advisors/query-performance',
      },
      {
        permanent: true,
        source: '/project/:ref/auth/column-privileges',
        destination: '/project/:ref/database/column-privileges',
      },
      {
        permanent: true,
        source: '/project/:ref/database/linter',
        destination: '/project/:ref/database/security-advisor',
      },
      {
        permanent: true,
        source: '/project/:ref/database/security-advisor',
        destination: '/project/:ref/advisors/security',
      },
      {
        permanent: true,
        source: '/project/:ref/database/performance-advisor',
        destination: '/project/:ref/advisors/performance',
      },
      {
        permanent: true,
        source: '/project/:ref/database/webhooks',
        destination: '/project/:ref/integrations/webhooks/overview',
      },
      {
        permanent: true,
        source: '/project/:ref/database/wrappers',
        destination: '/project/:ref/integrations?category=wrapper',
      },
      {
        permanent: true,
        source: '/project/:ref/database/cron-jobs',
        destination: '/project/:ref/integrations/cron',
      },
      {
        permanent: true,
        source: '/project/:ref/api/graphiql',
        destination: '/project/:ref/integrations/graphiql',
      },
      {
        permanent: true,
        source: '/project/:ref/settings/vault/secrets',
        destination: '/project/:ref/integrations/vault/secrets',
      },
      {
        permanent: true,
        source: '/project/:ref/settings/vault/keys',
        destination: '/project/:ref/integrations/vault/keys',
      },
      {
        permanent: true,
        source: '/project/:ref/integrations/cron-jobs',
        destination: '/project/:ref/integrations/cron',
      },
      {
        permanent: true,
        source: '/project/:ref/settings/warehouse',
        destination: '/project/:ref/settings/general',
      },
      {
        permanent: true,
        source: '/project/:ref/settings/functions',
        destination: '/project/:ref/functions/secrets',
      },
      {
        source: '/org/:slug/invoices',
        destination: '/org/:slug/billing#invoices',
        permanent: true,
      },
      {
        source: '/projects',
        destination: '/organizations',
        permanent: false,
      },

      ...(process.env.NEXT_PUBLIC_BASE_PATH?.length
        ? [
            {
              source: '/',
              destination: process.env.NEXT_PUBLIC_BASE_PATH,
              basePath: false,
              permanent: false,
            },
          ]
        : []),
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
            value: 'no-sniff',
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
    // to make Vercel avatars work without issue. Vercel uses SVGs for users who don't have set avatars.
    dangerouslyAllowSVG: true,
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
    ],
  },
  transpilePackages: [
    'ui',
    'ui-patterns',
    'common',
    'shared-data',
    'api-types',
    'icons',
    'libpg-query',
  ],
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  // Both configs for turbopack and webpack need to exist (and sync) because Nextjs still uses webpack for production building
  webpack(config) {
    config.module?.rules
      .find((rule) => rule.oneOf)
      .oneOf.forEach((rule) => {
        if (rule.issuer?.and?.[0]?.toString().includes('_app')) {
          const and = rule.issuer.and
          rule.issuer.or = [/[\\/]node_modules[\\/]monaco-editor[\\/]/, { and }]
          delete rule.issuer.and
        }
      })

    // .md files to be loaded as raw text
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })

    return config
  },
  onDemandEntries: {
    maxInactiveAge: 24 * 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
  typescript: {
    // WARNING: production builds can successfully complete even there are type errors
    // Typechecking is checked separately via .github/workflows/typecheck.yml
    ignoreBuildErrors: true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel
    ignoreDuringBuilds: true,
  },
}

// module.exports = withBundleAnalyzer(nextConfig)
// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
    ? withSentryConfig(withBundleAnalyzer(nextConfig), {
        silent: true,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Automatically annotate React components to show their full name in breadcrumbs and session replay
        reactComponentAnnotation: {
          enabled: true,
        },

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
      })
    : nextConfig
