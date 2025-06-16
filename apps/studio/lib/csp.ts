// To update copy and paste the response from https://www.google.com/supported_domains
const GOOGLE_SUPPORTED_DOMAINS =
  '.google.com .google.ad .google.ae .google.com.af .google.com.ag .google.al .google.am .google.co.ao .google.com.ar .google.as .google.at .google.com.au .google.az .google.ba .google.com.bd .google.be .google.bf .google.bg .google.com.bh .google.bi .google.bj .google.com.bn .google.com.bo .google.com.br .google.bs .google.bt .google.co.bw .google.by .google.com.bz .google.ca .google.cd .google.cf .google.cg .google.ch .google.ci .google.co.ck .google.cl .google.cm .google.cn .google.com.co .google.co.cr .google.com.cu .google.cv .google.com.cy .google.cz .google.de .google.dj .google.dk .google.dm .google.com.do .google.dz .google.com.ec .google.ee .google.com.eg .google.es .google.com.et .google.fi .google.com.fj .google.fm .google.fr .google.ga .google.ge .google.gg .google.com.gh .google.com.gi .google.gl .google.gm .google.gr .google.com.gt .google.gy .google.com.hk .google.hn .google.hr .google.ht .google.hu .google.co.id .google.ie .google.co.il .google.im .google.co.in .google.iq .google.is .google.it .google.je .google.com.jm .google.jo .google.co.jp .google.co.ke .google.com.kh .google.ki .google.kg .google.co.kr .google.com.kw .google.kz .google.la .google.com.lb .google.li .google.lk .google.co.ls .google.lt .google.lu .google.lv .google.com.ly .google.co.ma .google.md .google.me .google.mg .google.mk .google.ml .google.com.mm .google.mn .google.com.mt .google.mu .google.mv .google.mw .google.com.mx .google.com.my .google.co.mz .google.com.na .google.com.ng .google.com.ni .google.ne .google.nl .google.no .google.com.np .google.nr .google.nu .google.co.nz .google.com.om .google.com.pa .google.com.pe .google.com.pg .google.com.ph .google.com.pk .google.pl .google.pn .google.com.pr .google.ps .google.pt .google.com.py .google.com.qa .google.ro .google.ru .google.rw .google.com.sa .google.com.sb .google.sc .google.se .google.com.sg .google.sh .google.si .google.sk .google.com.sl .google.sn .google.so .google.sm .google.sr .google.st .google.com.sv .google.td .google.tg .google.co.th .google.com.tj .google.tl .google.tm .google.tn .google.to .google.com.tr .google.tt .google.com.tw .google.co.tz .google.com.ua .google.co.ug .google.co.uk .google.com.uy .google.co.uz .google.com.vc .google.co.ve .google.co.vi .google.com.vn .google.vu .google.ws .google.rs .google.co.za .google.co.zm .google.co.zw .google.cat'

// Parse Google supported domains for Analytics v4 with Google Signals
const GOOGLE_DOMAINS_FOR_ANALYTICS = GOOGLE_SUPPORTED_DOMAINS.split(' ')
  .map((domain) => `https://*${domain}`)
  .join(' ')

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
const CONFIGCAT_PROXY_URL = ['staging', 'local'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT ?? '')
  ? 'https://configcat.supabase.green'
  : 'https://configcat.supabase.com'
const STRIPE_SUBDOMAINS_URL = 'https://*.stripe.com'
const STRIPE_JS_URL = 'https://js.stripe.com'
const STRIPE_NETWORK_URL = 'https://*.stripe.network'
const CLOUDFLARE_URL = 'https://www.cloudflare.com'
const ONE_ONE_ONE_ONE_URL = 'https://one.one.one.one'
const VERCEL_URL = 'https://vercel.com'
const VERCEL_INSIGHTS_URL = 'https://*.vercel-insights.com'
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_USER_CONTENT_URL = 'https://raw.githubusercontent.com'
const GITHUB_USER_AVATAR_URL = 'https://avatars.githubusercontent.com'
const GOOGLE_USER_AVATAR_URL = 'https://lh3.googleusercontent.com'

// This is a custom domain for Stape, which isused for GTM servers
const STAPE_URL = 'https://ss.supabase.com'

// Google Analytics v4 URLs - Updated to use specific GA4 domains
const GOOGLE_TAG_MANAGER_URL = 'https://*.googletagmanager.com'
const GOOGLE_ANALYTICS_URL = 'https://*.google-analytics.com'
const ANALYTICS_GOOGLE_URL = 'https://*.analytics.google.com'

// Additional URLs for Google Analytics 4 with Google Signals
const GOOGLE_DOUBLECLICK_URL = 'https://*.g.doubleclick.net'
const GOOGLE_MAIN_URL = 'https://*.google.com'
const GOOGLE_PAGEAD_URL = 'https://pagead2.googlesyndication.com'
const GOOGLE_DOUBLECLICK_FRAME_URL = 'https://td.doubleclick.net'
const GOOGLE_TAG_MANAGER_FRAME_URL = 'https://www.googletagmanager.com'

const VERCEL_LIVE_URL = 'https://vercel.live'
const SENTRY_URL =
  'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io'
const SUPABASE_ASSETS_URL =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? 'https://frontend-assets.supabase.green'
    : 'https://frontend-assets.supabase.com'

const USERCENTRICS_URLS = 'https://*.usercentrics.eu'
const USERCENTRICS_APP_URL = 'https://app.usercentrics.eu'

// used by vercel live preview
const PUSHER_URL = 'https://*.pusher.com'
const PUSHER_URL_WS = 'wss://*.pusher.com'

export function getCSP(): string {
  const DEFAULT_SRC_URLS: string[] = [
    API_URL,
    SUPABASE_URL,
    GOTRUE_URL,
    SUPABASE_LOCAL_PROJECTS_URL_WS,
    SUPABASE_PROJECTS_URL,
    SUPABASE_PROJECTS_URL_WS,
    HCAPTCHA_SUBDOMAINS_URL,
    CONFIGCAT_URL,
    CONFIGCAT_PROXY_URL,
    STRIPE_SUBDOMAINS_URL,
    STRIPE_NETWORK_URL,
    CLOUDFLARE_URL,
    ONE_ONE_ONE_ONE_URL,
    VERCEL_INSIGHTS_URL,
    GITHUB_API_URL,
    GITHUB_USER_CONTENT_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_URLS,
    GOOGLE_ANALYTICS_URL,
    STAPE_URL,
    ANALYTICS_GOOGLE_URL,
    GOOGLE_TAG_MANAGER_URL,
    // Google Analytics 4 with Google Signals support
    GOOGLE_DOUBLECLICK_URL,
    GOOGLE_MAIN_URL,
    GOOGLE_PAGEAD_URL,
    ...GOOGLE_DOMAINS_FOR_ANALYTICS.split(' '),
  ]
  const SCRIPT_SRC_URLS: string[] = [
    CLOUDFLARE_CDN_URL,
    HCAPTCHA_JS_URL,
    STRIPE_JS_URL,
    SUPABASE_ASSETS_URL,
    GOOGLE_TAG_MANAGER_URL,
  ]
  const FRAME_SRC_URLS: string[] = [
    HCAPTCHA_ASSET_URL,
    STRIPE_JS_URL,
    STAPE_URL,
    // Google Analytics 4 with Google Signals frame sources
    GOOGLE_DOUBLECLICK_FRAME_URL,
    GOOGLE_TAG_MANAGER_FRAME_URL,
  ]
  const IMG_SRC_URLS: string[] = [
    SUPABASE_URL,
    SUPABASE_COM_URL,
    SUPABASE_PROJECTS_URL,
    GITHUB_USER_AVATAR_URL,
    GOOGLE_USER_AVATAR_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_APP_URL,
    STAPE_URL,
    GOOGLE_ANALYTICS_URL,
    GOOGLE_TAG_MANAGER_URL,
    // Google Analytics 4 with Google Signals image sources
    GOOGLE_DOUBLECLICK_URL,
    GOOGLE_MAIN_URL,
    ...GOOGLE_DOMAINS_FOR_ANALYTICS.split(' '),
  ]
  const STYLE_SRC_URLS: string[] = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL]
  const FONT_SRC_URLS: string[] = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL]

  const isDevOrStaging =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const defaultSrcDirective = [
    `default-src 'self'`,
    ...DEFAULT_SRC_URLS,
    ...(isDevOrStaging
      ? [
          SUPABASE_STAGING_PROJECTS_URL,
          SUPABASE_STAGING_PROJECTS_URL_WS,
          VERCEL_LIVE_URL,
          SUPABASE_DOCS_PROJECT_URL,
        ]
      : []),
    PUSHER_URL_WS,
    SENTRY_URL,
  ].join(' ')

  const imgSrcDirective = [
    `img-src 'self'`,
    `blob:`,
    `data:`,
    ...IMG_SRC_URLS,
    ...(isDevOrStaging ? [SUPABASE_STAGING_PROJECTS_URL, VERCEL_URL] : []),
  ].join(' ')

  const scriptSrcDirective = [
    `script-src 'self'`,
    `'unsafe-eval'`,
    `'unsafe-inline'`,
    ...SCRIPT_SRC_URLS,
    VERCEL_LIVE_URL,
    PUSHER_URL,
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

  const cspDirectives: string[] = [
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
