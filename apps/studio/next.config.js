const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Required for nextjs standalone build
const path = require('path')

// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const csp = [
  "frame-ancestors 'none';",
  // IS_PLATFORM
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' && process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? 'upgrade-insecure-requests;'
    : '',
]
  .filter(Boolean)
  .join(' ')

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  output: 'standalone',
  outputFileTracing: true,
  experimental: {
    // Storybook 7.5 upgrade seems to causes dev deps to be included in build output, removing it here
    outputFileTracingExcludes: {
      '*': [
        './node_modules/@swc/core-linux-x64-gnu',
        './node_modules/@swc/core-linux-x64-musl',
        './node_modules/esbuild/**/*',
        './node_modules/webpack/**/*',
        './node_modules/rollup/**/*',
      ],
    },
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
              destination: '/projects',
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
        destination: '/project/:ref/settings/addons?panel=computeInstance',
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
        source: '/project/:ref/sql',
        destination: '/project/:ref/sql/new',
        permanent: true,
      },
      ...(process.env.NEXT_PUBLIC_BASE_PATH?.length
        ? [
            {
              source: '/',
              destination: process.env.NEXT_PUBLIC_BASE_PATH,
              basePath: false,
              permanent: true,
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
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/img/:slug*',
        headers: [{ key: 'cache-control', value: 'max-age=2592000' }],
      },
      {
        source: '/fonts/:slug*',
        headers: [{ key: 'cache-control', value: 'max-age=2592000' }],
      },
    ]
  },
  images: {
    // to make Vercel avatars work without issue. Vercel uses SVGs for users who don't have set avatars.
    dangerouslyAllowSVG: true,
    domains: [
      'github.com',
      'avatars.githubusercontent.com',
      'api-frameworks.vercel.sh',
      'vercel.com',
    ],
  },
  transpilePackages: ['ui', 'common', 'shared-data'],
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

    return config
  },
}

// module.exports = withBundleAnalyzer(nextConfig)
// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
    ? withSentryConfig(
        withBundleAnalyzer(nextConfig),
        {
          silent: true,
        },
        {
          // For all available options, see:
          // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

          // Upload a larger set of source maps for prettier stack traces (increases build time)
          widenClientFileUpload: true,

          // Transpiles SDK to be compatible with IE11 (increases bundle size)
          transpileClientSDK: false,

          // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
          tunnelRoute: '/monitoring',

          // Hides source maps from generated client bundles
          hideSourceMaps: true,

          // Automatically tree-shake Sentry logger statements to reduce bundle size
          disableLogger: true,
        }
      )
    : nextConfig
