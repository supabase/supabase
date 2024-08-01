const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Required for nextjs standalone build
const path = require('path')

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : ''
const SUPABASE_URL = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : ''
const GOTRUE_URL = process.env.NEXT_PUBLIC_GOTRUE_URL
  ? new URL(process.env.NEXT_PUBLIC_GOTRUE_URL).origin
  : ''
const SUPABASE_PROJECTS_URL = 'https://*.supabase.co'
const SUPABASE_PROJECTS_URL_WS = 'wss://*.supabase.co'

// construct the URL for the Websocket Local URLs
let SUPABASE_LOCAL_PROJECTS_URL_WS = ''
if (SUPABASE_URL) {
  const url = new URL(SUPABASE_URL)
  const wsUrl = `${url.hostname}:${url.port}`
  SUPABASE_LOCAL_PROJECTS_URL_WS = `ws://${wsUrl} wss://${wsUrl}`
}

// Needed to test docs search in local dev
const SUPABASE_DOCS_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : ''

const SUPABASE_STAGING_PROJECTS_URL = 'https://*.supabase.red'
const SUPABASE_STAGING_PROJECTS_URL_WS = 'wss://*.supabase.red'
const SUPABASE_COM_URL = 'https://supabase.com'
const CLOUDFLARE_CDN_URL = 'https://cdnjs.cloudflare.com'
const HCAPTCHA_SUBDOMAINS_URL = 'https://*.hcaptcha.com'
const HCAPTCHA_ASSET_URL = 'https://newassets.hcaptcha.com'
const HCAPTCHA_JS_URL = 'https://js.hcaptcha.com'
const CONFIGCAT_URL = 'https://cdn-global.configcat.com'
const STRIPE_SUBDOMAINS_URL = 'https://*.stripe.com'
const STRIPE_JS_URL = 'https://js.stripe.com'
const STRIPE_NETWORK_URL = 'https://*.stripe.network'
const CLOUDFLARE_URL = 'https://www.cloudflare.com'
const ONE_ONE_ONE_ONE_URL = 'https://1.1.1.1'
const VERCEL_URL = 'https://vercel.com'
const VERCEL_INSIGHTS_URL = 'https://*.vercel-insights.com'
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_USER_CONTENT_URL = 'https://raw.githubusercontent.com'
const GITHUB_USER_AVATAR_URL = 'https://avatars.githubusercontent.com'
const VERCEL_LIVE_URL = 'https://vercel.live'
// used by vercel live preview
const PUSHER_URL = 'https://*.pusher.com'
const PUSHER_URL_WS = 'wss://*.pusher.com'

const DEFAULT_SRC_URLS = `${API_URL} ${SUPABASE_URL} ${GOTRUE_URL} ${SUPABASE_LOCAL_PROJECTS_URL_WS} ${SUPABASE_PROJECTS_URL} ${SUPABASE_PROJECTS_URL_WS} ${HCAPTCHA_SUBDOMAINS_URL} ${CONFIGCAT_URL} ${STRIPE_SUBDOMAINS_URL} ${STRIPE_NETWORK_URL} ${CLOUDFLARE_URL} ${ONE_ONE_ONE_ONE_URL} ${VERCEL_INSIGHTS_URL} ${GITHUB_API_URL} ${GITHUB_USER_CONTENT_URL}`
const SCRIPT_SRC_URLS = `${CLOUDFLARE_CDN_URL} ${HCAPTCHA_JS_URL} ${STRIPE_JS_URL}`
const FRAME_SRC_URLS = `${HCAPTCHA_ASSET_URL} ${STRIPE_JS_URL}`
const IMG_SRC_URLS = `${SUPABASE_URL} ${SUPABASE_COM_URL} ${SUPABASE_PROJECTS_URL} ${GITHUB_USER_AVATAR_URL}`
const STYLE_SRC_URLS = `${CLOUDFLARE_CDN_URL}`
const FONT_SRC_URLS = `${CLOUDFLARE_CDN_URL}`

const csp = [
  ...(process.env.VERCEL_ENV === 'preview' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? [
        `default-src 'self' ${DEFAULT_SRC_URLS} ${SUPABASE_STAGING_PROJECTS_URL} ${SUPABASE_STAGING_PROJECTS_URL_WS} ${VERCEL_LIVE_URL} ${PUSHER_URL} ${PUSHER_URL_WS} ${SUPABASE_DOCS_PROJECT_URL};`,
        `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${SCRIPT_SRC_URLS} ${VERCEL_LIVE_URL};`,
        `frame-src 'self' ${FRAME_SRC_URLS} ${VERCEL_LIVE_URL};`,
        `img-src 'self' blob: data: ${IMG_SRC_URLS} ${SUPABASE_STAGING_PROJECTS_URL} ${VERCEL_URL};`,
        `style-src 'self' 'unsafe-inline' ${STYLE_SRC_URLS} ${VERCEL_LIVE_URL};`,
        `font-src 'self' ${FONT_SRC_URLS} ${VERCEL_LIVE_URL};`,
        `worker-src 'self' blob: data:;`,
      ]
    : [
        `default-src 'self' ${DEFAULT_SRC_URLS};`,
        `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${SCRIPT_SRC_URLS};`,
        `frame-src 'self' ${FRAME_SRC_URLS};`,
        `img-src 'self' blob: data: ${IMG_SRC_URLS} ;`,
        `style-src 'self' 'unsafe-inline' ${STYLE_SRC_URLS};`,
        `font-src 'self' ${FONT_SRC_URLS};`,
        `worker-src 'self' blob: data:;`,
      ]),
  `object-src 'none';`,
  `base-uri 'self';`,
  `form-action 'self';`,
  `frame-ancestors 'none';`,
  `block-all-mixed-content;`,
  ...(process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? [`upgrade-insecure-requests;`]
    : []),
].join(' ')

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  output: 'standalone',
  experimental: {
    webpackBuildWorker: true,
    outputFileTracingExcludes: {
      '*': ['**/@electric-sql/pglite/**/*'],
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
        source: '/project/:ref/database/replication',
        destination: '/project/:ref/database/publications',
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
      {
        permanent: true,
        source: '/project/:ref/reports/linter',
        destination: '/project/:ref/database/linter',
      },
      {
        permanent: true,
        source: '/project/:ref/reports/query-performance',
        destination: '/project/:ref/database/query-performance',
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
            key: 'Content-Security-Policy',
            value: process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ? csp : "frame-ancestors 'none';",
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
  transpilePackages: [
    'ui',
    'ui-patterns',
    'common',
    'shared-data',
    'api-types',
    'icons',
    'libpg-query',
  ],
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
