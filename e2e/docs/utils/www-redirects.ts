import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile, match } from 'path-to-regexp'

export type RedirectRule = {
  source: string
  destination: string
  permanent: boolean
}

export type RedirectMatch = {
  source: string
  destination: string
  permanent: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPO_ROOT = join(__dirname, '../../..')
const WWW_REDIRECTS_PATH = 'apps/www/lib/redirects.js'

const requireFromHere = createRequire(import.meta.url)

/**
 * Loads apps/www/lib/redirects.js as data. It's a plain CommonJS array
 * (`module.exports = [{ source, destination, permanent }, ...]`), so this
 * executes no www app code — it's the same mechanism as requiring a JSON file.
 *
 * A docs preview deployment is the `docs` Vercel project; it never serves
 * these, only `zone-www-dot-com` does. That's the whole reason a redirect
 * looks broken on a preview and works on production.
 *
 * Skips conditional entries (a `has` clause keyed on host/query/cookie):
 * without full request context they can't be evaluated, and none of the
 * ~660 unconditional entries collide with a path they would otherwise match.
 */
export function loadWwwRedirects(repoRoot: string = DEFAULT_REPO_ROOT): RedirectRule[] {
  const redirectsPath = join(repoRoot, WWW_REDIRECTS_PATH)
  const raw = requireFromHere(redirectsPath) as Array<{
    source: string
    destination: string
    permanent?: boolean
    has?: unknown
  }>

  return raw
    .filter((entry) => !entry.has)
    .map((entry) => ({
      source: entry.source,
      destination: entry.destination,
      permanent: entry.permanent ?? false,
    }))
}

type CompiledRule = {
  rule: RedirectRule
  test: ReturnType<typeof match> | null
}

function compileRule(rule: RedirectRule): CompiledRule {
  try {
    return { rule, test: match(rule.source, { decode: decodeURIComponent }) }
  } catch {
    // A source path-to-regexp can't parse just means this rule is invisible to
    // the matcher — safe, since an unrecognized redirect falls through to
    // production corroboration rather than a false positive.
    return { rule, test: null }
  }
}

/**
 * Compiles rules once; call the returned matcher repeatedly against many
 * pathnames. First match wins, same order Vercel applies `redirects()` in.
 */
export function compileRedirectRules(
  rules: RedirectRule[]
): (pathname: string) => RedirectMatch | null {
  const compiled = rules.map(compileRule)

  return (pathname: string) => {
    for (const { rule, test } of compiled) {
      if (!test) continue
      const result = test(pathname)
      if (!result) continue

      const params = result.params as Record<string, string | string[]>
      const hasParams = Object.keys(params).length > 0
      if (!hasParams) {
        return { source: rule.source, destination: rule.destination, permanent: rule.permanent }
      }

      // Only reached for a dynamic source (e.g. `:match*`) that captured
      // segments to substitute into the destination. Most destinations in
      // this file are plain paths, so `compile()` accepts them — but a few
      // are absolute URLs or contain a literal query string, which
      // path-to-regexp can't parse as a template. Treat those as no match
      // rather than guess at a substitution.
      try {
        const destination = compile(rule.destination, { encode: encodeURIComponent })(params)
        return { source: rule.source, destination, permanent: rule.permanent }
      } catch {
        continue
      }
    }
    return null
  }
}

let defaultMatcher: ((pathname: string) => RedirectMatch | null) | null = null

/** Looks a path up in the real apps/www/lib/redirects.js, compiling it once. */
export function findRedirect(pathname: string): RedirectMatch | null {
  if (!defaultMatcher) defaultMatcher = compileRedirectRules(loadWwwRedirects())
  return defaultMatcher(pathname)
}
