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
 * @param {Env} env
 * @returns {string[]}
 */
function getScriptSrc(env) {
  const isPreview = isPreviewOrStaging(env)

  const sources = [
    "'self'",
    // Next.js inline scripts, next-themes, the GTM bootstrap and a few page loaders are inline.
    // A nonce needs dynamic rendering, and most of www is static.
    "'unsafe-inline'",
    // MDXClient (next-mdx-remote-client) evaluates MDX with the Function constructor on the
    // changelog, customer, event, alternative and partner catalog pages. A per-route policy
    // doesn't work: client-side navigation keeps the CSP of the document that was loaded first.
    // Next.js also needs it in development.
    "'unsafe-eval'",
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
 * @param {{ env?: Env }} [options]
 */
function buildCsp({ env = process.env } = {}) {
  return [
    `script-src ${getScriptSrc(env).join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
}

/**
 * @typedef {{ exact: string[], subtree: string[] }} PathExclusions
 */

/**
 * Paths that www proxies to other apps. A rewrite without parameters excludes exactly its path,
 * for example /openapi.json. A rewrite with parameters excludes the static path before the first
 * parameter and everything below it, for example /dashboard/:path* excludes /dashboard.
 * @param {Rewrite[]} rewrites
 * @returns {PathExclusions}
 */
function getProxiedPathExclusions(rewrites) {
  const exact = new Set()
  const subtree = new Set()

  for (const rewrite of rewrites) {
    // Internal rewrites start with a path. Anything else is a URL, or an env var that's unset locally.
    if (rewrite.destination.startsWith('/')) continue

    const segments = rewrite.source.replaceAll('\\.', '.').split('/').slice(1)
    const firstDynamic = segments.findIndex((segment) => /[:(*]/.test(segment))

    if (firstDynamic === -1) {
      exact.add(`/${segments.join('/')}`)
    } else {
      subtree.add(`/${segments.slice(0, firstDynamic).join('/')}`.replace(/(.)\/$/, '$1'))
    }
  }

  const isInSubtree = (/** @type {string} */ path) =>
    [...subtree].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

  return {
    exact: [...exact].filter((path) => !isInSubtree(path)),
    subtree: [...subtree],
  }
}

/** @param {string} path */
const toPattern = (path) => path.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Source that matches every path except the proxied ones.
 * @param {PathExclusions} exclusions
 */
function getWwwOwnedSource({ exact, subtree }) {
  const excluded = [
    ...exact.map((path) => `${toPattern(path)}$`),
    ...subtree.map((path) => `${toPattern(path)}(?:/|$)`),
  ]
  return `/:path((?!(?:${excluded.join('|')})).*)`
}

/**
 * Header rules for next.config.mjs.
 * @param {Rewrite[]} rewrites
 * @param {Env} [env]
 * @returns {HeaderRule[]}
 */
function getSecurityHeaderRules(rewrites, env = process.env) {
  return [
    {
      source: getWwwOwnedSource(getProxiedPathExclusions(rewrites)),
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: buildCsp({ env }) },
      ],
    },
  ]
}

module.exports = {
  buildCsp,
  getProxiedPathExclusions,
  getSecurityHeaderRules,
  getWwwOwnedSource,
}
