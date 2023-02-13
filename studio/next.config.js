const { withSentryConfig } = require('@sentry/nextjs')
const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// this is required to use shared packages in the packages directory
const withTM = require('next-transpile-modules')(['ui', 'common'])

// Required for nextjs standalone build
const path = require('path')

// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const csp = [
  "frame-ancestors 'none';",
  // IS_PLATFORM
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ? 'upgrade-insecure-requests;' : '',
]
  .filter(Boolean)
  .join(' ')

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sign-in',
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
        source: '/project/:ref/settings/billing',
        destination: '/project/:ref/settings/billing/subscription',
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
        destination: '/project/:ref/logs/pgbouncer-logs',
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
        source: '/org/:slug/settings',
        destination: '/org/:slug/general',
        permanent: true,
      },
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
    domains: ['github.com'],
  },
  // Ref: https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
  experimental: {
    outputStandalone: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
}

// Export all config
const plugins = [[withBundleAnalyzer({})], withTM()]

const moduleExports = withPlugins(plugins, nextConfig)

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
    ? withSentryConfig(moduleExports, sentryWebpackPluginOptions)
    : withPlugins([withTM()], nextConfig)
