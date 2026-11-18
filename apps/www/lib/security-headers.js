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

/** @param {string} text */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const DEFAULT_PARAM_PATTERN = '[^/]+?'

/**
 * Converts a rewrite source to a regex that matches the same paths, without the leading slash.
 * Follows the path-to-regexp syntax that Next.js uses: escaped characters, `:name`,
 * `:name(pattern)`, and the `*`, `+` and `?` modifiers, which make the preceding slash part
 * of the repeated or optional group.
 * @param {string} source
 */
function sourceToPattern(source) {
  let pattern = ''
  let i = 0

  while (i < source.length) {
    const char = source[i]

    if (char === '\\') {
      pattern += escapeRegExp(source[i + 1] ?? '')
      i += 2
      continue
    }

    if (char !== ':' && char !== '(') {
      pattern += escapeRegExp(char)
      i += 1
      continue
    }

    // A named parameter, optionally with its own pattern, or an unnamed group
    if (char === ':') {
      i += 1
      while (i < source.length && /\w/.test(source[i])) i += 1
    }

    let paramPattern = DEFAULT_PARAM_PATTERN
    if (source[i] === '(') {
      let depth = 0
      const patternStart = i + 1
      for (; i < source.length; i += 1) {
        if (source[i] === '\\') {
          i += 1
        } else if (source[i] === '(') {
          depth += 1
        } else if (source[i] === ')') {
          depth -= 1
          if (depth === 0) break
        }
      }
      // Capturing groups would break the surrounding header source, so make them non-capturing
      paramPattern = source.slice(patternStart, i).replace(/\((?!\?)/g, '(?:')
      i += 1
    }

    const modifier = /[*+?]/.test(source[i] ?? '') ? source[i] : ''
    if (modifier) i += 1

    const segment = `(?:${paramPattern})`
    const hasSlashPrefix = pattern.endsWith('/')
    if (hasSlashPrefix && modifier) {
      pattern = pattern.slice(0, -1)
      if (modifier === '?') pattern += `(?:/${segment})?`
      if (modifier === '*') pattern += `(?:/${segment}(?:/${segment})*)?`
      if (modifier === '+') pattern += `/${segment}(?:/${segment})*`
    } else {
      pattern += `${segment}${modifier}`
    }
  }

  return pattern.replace(/^\//, '')
}

/**
 * Patterns for the paths that www proxies to other apps, one per external rewrite.
 * @param {Rewrite[]} rewrites
 * @returns {string[]}
 */
function getProxiedPathPatterns(rewrites) {
  const patterns = rewrites
    // Internal rewrites start with a path. Anything else is a URL, or an env var that's unset locally.
    .filter((rewrite) => !rewrite.destination.startsWith('/'))
    .map((rewrite) => sourceToPattern(rewrite.source))

  return [...new Set(patterns)]
}

/**
 * Source that matches every path except the proxied ones.
 * @param {string[]} proxiedPatterns
 */
function getWwwOwnedSource(proxiedPatterns) {
  if (proxiedPatterns.length === 0) return '/:path(.*)'
  return `/:path((?!(?:${proxiedPatterns.map((pattern) => `${pattern}$`).join('|')})).*)`
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
      source: getWwwOwnedSource(getProxiedPathPatterns(rewrites)),
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
  getProxiedPathPatterns,
  getSecurityHeaderRules,
  getWwwOwnedSource,
}
