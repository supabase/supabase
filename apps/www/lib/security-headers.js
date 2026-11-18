// @ts-check

/**
 * Security headers for pages served by www.
 *
 * www is also the zone router: lib/rewrites.js proxies other apps (Studio at /dashboard, docs,
 * library, design-system, ...). Header rules in next.config.mjs apply to those proxied responses
 * too, so these headers are scoped to the paths www serves itself. The proxied apps set their
 * own headers.
 */

/**
 * @typedef {Record<string, string | undefined>} Env
 * @typedef {{ source: string, destination: string }} Rewrite
 * @typedef {{ source: string, headers: { key: string, value: string }[] }} HeaderRule
 */

/** @param {Env} env */
function isPreviewOrStaging(env) {
  return (
    env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
  )
}

/**
 * Origin of the PostHog host the client uses, with the same fallback as
 * packages/common/posthog-client.ts.
 * @param {Env} env
 */
function getPostHogOrigin(env) {
  try {
    return new URL(env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ph.supabase.green').origin
  } catch {
    return undefined
  }
}

/**
 * @param {{ env: Env, allowEval: boolean }} options
 * @returns {string[]}
 */
function getScriptSrc({ env, allowEval }) {
  const isDev = env.NODE_ENV === 'development'
  const isPreview = isPreviewOrStaging(env)

  const sources = [
    "'self'",
    // Next.js inline scripts, next-themes, the GTM bootstrap and a few page loaders are inline.
    // A nonce needs dynamic rendering, and most of www is static.
    "'unsafe-inline'",
    // Client-side MDX evaluation (see EVAL_ROUTE_SOURCES), and Next.js in development
    allowEval || isDev ? "'unsafe-eval'" : undefined,
    // Google Tag Manager through Stape (packages/common/telemetry.tsx)
    'https://ss.supabase.com',
    // PostHog (packages/common/posthog-client.ts)
    getPostHogOrigin(env),
    isPreview ? 'https://ph.supabase.green' : 'https://ph.supabase.com',
    // Usercentrics consent manager (packages/common/consent-state.ts)
    'https://*.usercentrics.eu',
    // Tweet embeds in blog posts
    'https://platform.twitter.com',
    'https://cdn.syndication.twimg.com',
    // HubSpot forms and meetings (packages/marketing/src/forms/HubSpotFormEmbed.tsx, _go/events)
    'https://js.hsforms.net',
    'https://*.hsforms.net',
    'https://static.hsappstatic.net',
    // hCaptcha (pages/opt-out/[ref].tsx)
    'https://js.hcaptcha.com',
    'https://*.hcaptcha.com',
    // Default.com (pages/contact/sales.tsx)
    'https://import-cdn.default.com',
    // Buy with AWS (lib/aws-marketplace.ts)
    'https://bwa.marketplace.awsstatic.com',
    // unicornstudio-react (state-of-startups). Path-scoped: jsDelivr serves any npm or GitHub package.
    'https://cdn.jsdelivr.net/gh/hiunicornstudio/',
    // Vercel toolbar on preview deployments
    isPreview ? 'https://vercel.live' : undefined,
  ]

  return [...new Set(sources.filter((source) => source !== undefined))]
}

/**
 * @param {{ env?: Env, allowEval?: boolean }} [options]
 */
function buildCsp({ env = process.env, allowEval = false } = {}) {
  return [
    `script-src ${getScriptSrc({ env, allowEval }).join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
}

/**
 * Pages that render MDX on the client with next-mdx-remote-client's MDXClient, which evaluates
 * code with the Function constructor and needs 'unsafe-eval'.
 */
const EVAL_ROUTE_SOURCES = [
  // pages/changelog.tsx, pages/changelog/[slug].tsx
  '/changelog/:path*',
  // pages/customers/[slug].tsx
  '/customers/:slug',
  // pages/events/[slug].tsx
  '/events/:slug',
  // pages/alternatives/[slug].tsx (layouts/comparison.tsx)
  '/alternatives/:slug',
  // app/partners/catalog/[slug]/PartnerCatalogDetail.tsx
  '/partners/catalog/:slug',
]

/**
 * First path segment of every rewrite that proxies to another app.
 * @param {Rewrite[]} rewrites
 * @returns {string[]}
 */
function getProxiedPathPrefixes(rewrites) {
  const prefixes = rewrites
    // Internal rewrites start with a path. Anything else is a URL, or an env var that's unset locally.
    .filter((rewrite) => !rewrite.destination.startsWith('/'))
    .map((rewrite) => rewrite.source.match(/^\/([A-Za-z0-9_-]+)/)?.[1])
    .filter((prefix) => prefix !== undefined)

  return [...new Set(prefixes)]
}

/**
 * Source that matches every path except the proxied prefixes and anything below them.
 * @param {string[]} proxiedPrefixes
 */
function getWwwOwnedSource(proxiedPrefixes) {
  return `/:path((?!(?:${proxiedPrefixes.join('|')})(?:/|\\.|$)).*)`
}

/**
 * Header rules for next.config.mjs. Rules for the eval routes come last, because Next.js uses
 * the last matching rule for a header key.
 * @param {Rewrite[]} rewrites
 * @param {Env} [env]
 * @returns {HeaderRule[]}
 */
function getSecurityHeaderRules(rewrites, env = process.env) {
  return [
    {
      source: getWwwOwnedSource(getProxiedPathPrefixes(rewrites)),
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: buildCsp({ env, allowEval: false }) },
      ],
    },
    ...EVAL_ROUTE_SOURCES.map((source) => ({
      source,
      headers: [{ key: 'Content-Security-Policy', value: buildCsp({ env, allowEval: true }) }],
    })),
  ]
}

module.exports = {
  EVAL_ROUTE_SOURCES,
  buildCsp,
  getProxiedPathPrefixes,
  getSecurityHeaderRules,
  getWwwOwnedSource,
}
