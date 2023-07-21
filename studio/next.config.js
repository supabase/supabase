const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// this is required to use shared packages in the packages directory
const withTM = require('next-transpile-modules')(['ui', 'common', 'shared-data'])

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

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://supabase.com/dashboard',
        permanent: true,
      },
      {
        source: '/:path*',
        destination: 'https://supabase.com/dashboard/:path*',
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
    domains: ['github.com', 'api-frameworks.vercel.sh', 'vercel.com'],
  },
  // Ref: https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
}

// Export all config
const moduleExports = withTM(withBundleAnalyzer(nextConfig))

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
    : withTM(nextConfig)
