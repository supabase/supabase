const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : ''
const SUPABASE_URL = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : ''
const GOTRUE_URL = process.env.NEXT_PUBLIC_GOTRUE_URL
  ? new URL(process.env.NEXT_PUBLIC_GOTRUE_URL).origin
  : ''
const MARKETPLACE_API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL
  ? new URL(process.env.NEXT_PUBLIC_MARKETPLACE_API_URL).origin
  : ''

const SUPABASE_PROJECTS_URL = 'https://*.supabase.co https://*.storage.supabase.co'
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

// Needed to test docs content API in local dev
const SUPABASE_CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL
  ? new URL(process.env.NEXT_PUBLIC_CONTENT_API_URL).origin
  : ''

const isDevOrStaging =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

const NIMBUS_STAGING_PROJECTS_URL = 'https://*.nmb-proj.com'
const NIMBUS_STAGING_PROJECTS_URL_WS = 'wss://*.nmb-proj.com'

const NIMBUS_PROD_PROJECTS_URL = process.env.NIMBUS_PROD_PROJECTS_URL || ''
const NIMBUS_PROD_PROJECTS_URL_WS = process.env.NIMBUS_PROD_PROJECTS_URL_WS || ''

const SUPABASE_STAGING_PROJECTS_URL = 'https://*.supabase.red https://*.storage.supabase.red'
const SUPABASE_STAGING_PROJECTS_URL_WS = 'wss://*.supabase.red'
const SUPABASE_COM_URL = 'https://supabase.com'
const CLOUDFLARE_CDN_URL = 'https://cdnjs.cloudflare.com'
const HCAPTCHA_SUBDOMAINS_URL = 'https://*.hcaptcha.com'
const HCAPTCHA_ASSET_URL = 'https://newassets.hcaptcha.com'
const HCAPTCHA_JS_URL = 'https://js.hcaptcha.com'
const CONFIGCAT_URL = 'https://cdn-global.configcat.com'
const CONFIGCAT_PROXY_URL = ['staging', 'local'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT ?? '')
  ? 'https://configcat.supabase.green'
  : 'https://configcat.supabase.com'
const STRIPE_SUBDOMAINS_URL = 'https://*.stripe.com'
const STRIPE_JS_URL = 'https://js.stripe.com'
const STRIPE_NETWORK_URL = 'https://*.stripe.network'
const CLOUDFLARE_URL = 'https://www.cloudflare.com'
const VERCEL_URL = 'https://vercel.com'
const VERCEL_INSIGHTS_URL = 'https://*.vercel-insights.com'
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_USER_CONTENT_URL = 'https://raw.githubusercontent.com'
const GITHUB_USER_AVATAR_URL = 'https://avatars.githubusercontent.com'
const GOOGLE_USER_AVATAR_URL = 'https://lh3.googleusercontent.com'

// This is a custom domain for Stape, which isused for GTM servers
const STAPE_URL = 'https://ss.supabase.com'

const VERCEL_LIVE_URL = 'https://vercel.live'
const SENTRY_URL =
  'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io'
const SUPABASE_ASSETS_URL =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? 'https://frontend-assets.supabase.green'
    : 'https://frontend-assets.supabase.com'
const POSTHOG_URL = isDevOrStaging ? 'https://ph.supabase.green' : 'https://ph.supabase.com'

const USERCENTRICS_URLS = 'https://*.usercentrics.eu'
const USERCENTRICS_APP_URL = 'https://app.usercentrics.eu'

// used by vercel live preview
const PUSHER_URL = 'https://*.pusher.com'
const PUSHER_URL_WS = 'wss://*.pusher.com'

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com'

// [console fork] Self-host: each project's data plane (kong) runs on a dynamic
// localhost port (e.g. http://localhost:20006). The dashboard talks to those
// endpoints DIRECTLY from the browser for resumable (tus) uploads and for image
// previews / public URLs — not through the BFF — so the per-project origins must
// be allowed by the CSP or the browser blocks them ("violates ... connect-src").
// We can't enumerate the ports ahead of time, so allow any localhost port.
const SELF_HOST_LOCAL_PROJECTS = 'http://localhost:* http://127.0.0.1:*'
const SELF_HOST_LOCAL_PROJECTS_WS = 'ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*'

export function getCSP() {
  const DEFAULT_SRC_URLS = [
    API_URL,
    SUPABASE_URL,
    GOTRUE_URL,
    MARKETPLACE_API_URL,
    SUPABASE_LOCAL_PROJECTS_URL_WS,
    SUPABASE_PROJECTS_URL,
    SUPABASE_PROJECTS_URL_WS,
    HCAPTCHA_SUBDOMAINS_URL,
    CONFIGCAT_URL,
    CONFIGCAT_PROXY_URL,
    STRIPE_SUBDOMAINS_URL,
    STRIPE_NETWORK_URL,
    CLOUDFLARE_URL,
    VERCEL_INSIGHTS_URL,
    GITHUB_API_URL,
    GITHUB_USER_CONTENT_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_URLS,
    STAPE_URL,
    GOOGLE_MAPS_API_URL,
    POSTHOG_URL,
    ...(!!NIMBUS_PROD_PROJECTS_URL ? [NIMBUS_PROD_PROJECTS_URL, NIMBUS_PROD_PROJECTS_URL_WS] : []),
    CLOUDFLARE_CDN_URL,
    // [console fork] allow direct browser → per-project kong (uploads/realtime/etc.)
    SELF_HOST_LOCAL_PROJECTS,
    SELF_HOST_LOCAL_PROJECTS_WS,
  ]
  const SCRIPT_SRC_URLS = [
    CLOUDFLARE_CDN_URL,
    HCAPTCHA_JS_URL,
    STRIPE_JS_URL,
    SUPABASE_ASSETS_URL,
    STAPE_URL,
    POSTHOG_URL,
    USERCENTRICS_URLS,
  ]
  const FRAME_SRC_URLS = [
    HCAPTCHA_ASSET_URL,
    STRIPE_JS_URL,
    STAPE_URL,
    ...(isDevOrStaging ? [POSTHOG_URL] : []),
  ]
  const IMG_SRC_URLS = [
    SUPABASE_URL,
    SUPABASE_COM_URL,
    SUPABASE_PROJECTS_URL,
    GITHUB_USER_AVATAR_URL,
    GOOGLE_USER_AVATAR_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_APP_URL,
    STAPE_URL,
    USERCENTRICS_URLS,
    MARKETPLACE_API_URL,
    ...(!!NIMBUS_PROD_PROJECTS_URL ? [NIMBUS_PROD_PROJECTS_URL, NIMBUS_PROD_PROJECTS_URL_WS] : []),
    // [console fork] image previews / public URLs are served straight from the
    // project's storage endpoint on a local port.
    SELF_HOST_LOCAL_PROJECTS,
  ]
  const STYLE_SRC_URLS = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL]
  const FONT_SRC_URLS = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL]

  const defaultSrcDirective = [
    `default-src 'self'`,
    ...DEFAULT_SRC_URLS,
    ...(isDevOrStaging
      ? [
          SUPABASE_STAGING_PROJECTS_URL,
          SUPABASE_STAGING_PROJECTS_URL_WS,
          NIMBUS_STAGING_PROJECTS_URL,
          NIMBUS_STAGING_PROJECTS_URL_WS,
          VERCEL_LIVE_URL,
          SUPABASE_DOCS_PROJECT_URL,
          SUPABASE_CONTENT_API_URL,
        ]
      : []),
    PUSHER_URL_WS,
    SENTRY_URL,
  ].join(' ')

  const imgSrcDirective = [
    `img-src 'self'`,
    `blob:`,
    `data:`,
    // [console fork] image previews / public URLs are served from the project's
    // storage endpoint, which may be a custom domain (https), an EC2 host (http) or a
    // local port (http).
    `https:`,
    `http:`,
    ...IMG_SRC_URLS,
    ...(isDevOrStaging
      ? [SUPABASE_STAGING_PROJECTS_URL, NIMBUS_STAGING_PROJECTS_URL, VERCEL_URL]
      : []),
  ].join(' ')

  const scriptSrcDirective = [
    `script-src 'self'`,
    `'unsafe-eval'`,
    `'unsafe-inline'`,
    ...SCRIPT_SRC_URLS,
    VERCEL_LIVE_URL,
    PUSHER_URL,
    GOOGLE_MAPS_API_URL,
  ].join(' ')

  const frameSrcDirective = [`frame-src 'self'`, ...FRAME_SRC_URLS, VERCEL_LIVE_URL].join(' ')

  const styleSrcDirective = [
    `style-src 'self'`,
    `'unsafe-inline'`,
    ...STYLE_SRC_URLS,
    VERCEL_LIVE_URL,
  ].join(' ')

  const fontSrcDirective = [`font-src 'self'`, ...FONT_SRC_URLS, VERCEL_LIVE_URL].join(' ')

  const workerSrcDirective = [`worker-src 'self'`, `blob:`, `data:`].join(' ')

  const connectSrcDirective = [
    `connect-src 'self'`,
    `data:`,
    `blob:`,
    // [console fork] Self-host has no single parent project domain (cloud uses
    // *.supabase.co). A project's data plane is reached DIRECTLY from the browser
    // (tus/resumable uploads, realtime websockets, image previews) and can live on:
    //   - a shared-infra local port      -> http://localhost:<port>
    //   - a dedicated EC2 instance host   -> http://ec2-x-x-x-x.compute.amazonaws.com:8000
    //   - a custom domain (TLS)           -> https://db.example.com
    // These are dynamic/arbitrary, so we can't enumerate them. Allow every project
    // scheme broadly (the self-host analog of cloud's *.supabase.co wildcard) so EC2
    // and custom domains both work now and in the future:
    `https:`,
    `http:`,
    `ws:`,
    `wss:`,
    ...DEFAULT_SRC_URLS,
    ...(isDevOrStaging
      ? [
          SUPABASE_STAGING_PROJECTS_URL,
          SUPABASE_STAGING_PROJECTS_URL_WS,
          NIMBUS_STAGING_PROJECTS_URL,
          NIMBUS_STAGING_PROJECTS_URL_WS,
          VERCEL_LIVE_URL,
          SUPABASE_DOCS_PROJECT_URL,
          SUPABASE_CONTENT_API_URL,
        ]
      : []),
    PUSHER_URL_WS,
    SENTRY_URL,
  ].join(' ')

  const cspDirectives = [
    connectSrcDirective,
    defaultSrcDirective,
    imgSrcDirective,
    scriptSrcDirective,
    frameSrcDirective,
    styleSrcDirective,
    fontSrcDirective,
    workerSrcDirective,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `block-all-mixed-content`,
    ...(process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? [`upgrade-insecure-requests`]
      : []),
  ]

  const csp = cspDirectives.join('; ') + ';'

  // Replace newline characters and spaces
  return csp.replace(/\s{2,}/g, ' ').trim()
}
