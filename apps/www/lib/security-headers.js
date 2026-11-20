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

// The path-to-regexp build and options that Next.js compiles route sources with
// (next/dist/lib/build-custom-route.js)
const { parse, pathToRegexp } = require('next/dist/compiled/path-to-regexp')

const PATH_TO_REGEXP_OPTIONS = { strict: true, sensitive: false, delimiter: '/' }

/**
 * @typedef {{ name: string | number, prefix: string, suffix: string, pattern: string, modifier: string }} Key
 * @typedef {string | Key} Token
 */

/** Same escaping as path-to-regexp. @param {string} text */
const escapeString = (text) => text.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')

/**
 * Regex for one token, built like path-to-regexp's tokensToRegexp but with non-capturing groups,
 * because the result goes inside a header source. Custom patterns are used as written, so escaped
 * characters such as \( stay escaped.
 * @param {Token} token
 * @param {{ atRoot?: boolean }} [options] The token takes the path's leading slash, which the
 *   www header source consumes itself. Drop the first slash of its first prefix and treat the
 *   token as present: the caller handles the absent case of an optional token.
 */
function tokenToPattern(token, { atRoot = false } = {}) {
  if (typeof token === 'string') return escapeString(atRoot ? token.slice(1) : token)

  const prefix = escapeString(token.prefix)
  // Only the first occurrence loses its slash. Repetitions keep the full prefix.
  const firstPrefix = atRoot ? escapeString(token.prefix.slice(1)) : prefix
  const suffix = escapeString(token.suffix)

  if (!token.pattern) return `(?:${firstPrefix}${suffix})${atRoot ? '' : token.modifier}`

  const pattern = `(?:${token.pattern})`
  const isRepeated = token.modifier === '+' || token.modifier === '*'

  if (!prefix && !suffix) return `(?:${pattern}${token.modifier})`

  // The modifier applies to the prefix and suffix too, for example the dot in /asset.:ext?
  const modifier =
    atRoot || token.modifier === '+' ? '' : token.modifier === '*' ? '?' : token.modifier
  const repeats = isRepeated ? `(?:${suffix}${prefix}${pattern})*` : ''
  return `(?:${firstPrefix}${pattern}${repeats}${suffix})${modifier}`
}

/** @param {Token} token */
const startsWithSlash = (token) =>
  typeof token === 'string' ? token.startsWith('/') : token.prefix.startsWith('/')

/**
 * Regex for the part of a path after its leading slash, for paths that a rewrite source matches.
 * The www header source consumes the leading slash itself, so a root-level parameter such as
 * /:path* or /:slug? needs its slash handled here instead of inside an optional group.
 * @param {Token[]} tokens
 * @returns {string}
 */
function tokensAfterRootSlash(tokens) {
  const [first, ...rest] = tokens
  const restPattern = rest.map((token) => tokenToPattern(token)).join('')

  // Nothing is left to match the leading slash. Next's trailing-slash rule covers the empty
  // match, see sourceToPattern.
  if (first === undefined) return '(?!)'

  if (!startsWithSlash(first)) {
    // A literal or prefix without a slash can't match the leading slash
    if (typeof first === 'string' || first.prefix) return '(?!)'
    // A parameter without a prefix could match the slash with its own pattern
    throw new Error(
      `Unsupported rewrite source for the www security headers: ${JSON.stringify(first)}`
    )
  }

  const present = `${tokenToPattern(first, { atRoot: true })}${restPattern}`
  if (typeof first === 'string' || (first.modifier !== '?' && first.modifier !== '*')) {
    return present
  }

  // An optional root parameter can also be absent, and then the next token takes the slash
  return `(?:${present}|${tokensAfterRootSlash(rest)})`
}

/**
 * Converts a rewrite source to a regex for the same paths, without their leading slash.
 * Next.js lets every custom route match an optional trailing slash (modifyRouteRegex in
 * next/dist/lib/redirect-status.js). So a source that matches the empty path, such as /:slug?,
 * also matches /, which leaves nothing after the leading slash.
 * @param {string} source
 */
function sourceToPattern(source) {
  const pattern = `${tokensAfterRootSlash(parse(source, PATH_TO_REGEXP_OPTIONS))}(?:\\/)?`
  const matchesEmptyPath = pathToRegexp(source, [], PATH_TO_REGEXP_OPTIONS).test('')
  return matchesEmptyPath ? `(?:${pattern}|)` : pattern
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
