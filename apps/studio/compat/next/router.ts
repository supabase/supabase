import {
  useLocation,
  useMatches,
  useParams,
  useSearch,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'
import { useMemo } from 'react'

import { splitInternalUrl } from '@/lib/internal-url'

import { getRouterEventsProxy } from './_router-events'

// Next's pages-router exposes `router.pathname` as the route *pattern*
// (e.g. `/project/[ref]/sql/[id]`), not the resolved URL. TanStack's
// route id uses `$param` — convert so legacy code that does
// `router.pathname.endsWith('/sql/[id]')` keeps working.
//
// Also strip the trailing slash TanStack appends to index-route ids
// (`/project/$ref/`). Next's pages-router never includes a trailing
// slash, so consumers like `router.pathname.split('/')[3]` (used in
// the project sidebar's active-route check) silently see an empty
// string for index pages instead of `undefined`, and the home icon
// stops highlighting. The root path stays `/` either way.
function toNextPathPattern(routeId: string) {
  // Strip TanStack's layout-route segments — they're prefixed with `_`
  // (`_app`, `_auth`, etc.) and don't appear in the URL or in Next's
  // `router.pathname`. Without this, downstream code that derives a path
  // segment from `pathname.split('/')[N]` indexes into the wrong slot —
  // e.g. Sidebar uses index 3 to pick the active route, expecting
  // `/org/[slug]/general` but receiving `/_app/org/[slug]/general` and
  // ending up with `[slug]` instead of `general`.
  const withoutLayoutSegments = routeId.replace(/\/_[a-zA-Z0-9_]+(?=\/|$)/g, '')
  const withBracketParams = withoutLayoutSegments.replace(/\$([a-zA-Z0-9_]+)/g, '[$1]')
  if (withBracketParams === '' || withBracketParams === '/') return '/'
  return withBracketParams.replace(/\/$/, '')
}

// Normalise TanStack's `router.basepath` to Next's `router.basePath`
// shape: '' for "no basePath" or '/path' for "configured" (leading
// slash, no trailing slash).
function toNextBasePath(tanstackBasepath: string | undefined): string {
  if (!tanstackBasepath || tanstackBasepath === '/') return ''
  const withLeading = tanstackBasepath.startsWith('/') ? tanstackBasepath : `/${tanstackBasepath}`
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading
}

type QueryValue = string | number | boolean | string[] | undefined | null
type UrlObject = {
  pathname?: string
  query?: Record<string, QueryValue> | string
  hash?: string
  search?: string
}

function serializeQuery(query: UrlObject['query']): string {
  if (!query) return ''
  if (typeof query === 'string') return query.startsWith('?') ? query : `?${query}`
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(query)) {
    if (raw == null) continue
    if (Array.isArray(raw)) {
      for (const item of raw) if (item != null) params.append(key, String(item))
    } else {
      params.set(key, String(raw))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

// Next's pages-router fills dynamic segments in a UrlObject's `pathname` from
// `query`, then drops the consumed keys from the query string — e.g.
// `push({ pathname: '/project/[ref]/editor/[id]', query: { ref, id, foo } })`
// resolves to `/project/<ref>/editor/<id>?foo=...`. `router.pathname` here is
// the bracketed route *pattern* (see toNextPathPattern) and callers like
// useUrlState push it back verbatim, so without this a sort/filter update on a
// dynamic route would navigate TanStack to a LITERAL `/project/[ref]/...`,
// which matches no project (ref === '[ref]') and bounces to a "project not
// found" redirect. Mirrors Next's behaviour so those pushes stay on-page.
function interpolatePathname(
  pathname: string,
  query: Record<string, QueryValue>
): { pathname: string; query: Record<string, QueryValue> } {
  if (!pathname.includes('[')) return { pathname, query }
  const consumed = new Set<string>()
  const encodeValue = (v: QueryValue) =>
    v == null
      ? ''
      : Array.isArray(v)
        ? v.map((item) => encodeURIComponent(String(item))).join('/')
        : encodeURIComponent(String(v))
  const interpolated = pathname
    // optional + required catch-all: `[[...name]]` / `[...name]`
    .replace(/\[\[?\.\.\.([^\]]+)\]?\]/g, (_match, name: string) => {
      consumed.add(name)
      return encodeValue(query[name])
    })
    // single dynamic segment: `[name]`
    .replace(/\[([^\]]+)\]/g, (_match, name: string) => {
      consumed.add(name)
      return encodeValue(query[name])
    })
  if (consumed.size === 0) return { pathname: interpolated, query }
  const rest: Record<string, QueryValue> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!consumed.has(key)) rest[key] = value
  }
  return { pathname: interpolated, query: rest }
}

// TanStack resolves a `?`- or `#`-only relative `to` by *appending* it to the
// current path, injecting a trailing slash: navigating to `?preset=x` from
// `/advisors/security` lands on `/advisors/security/?preset=x`. Next resolved
// these against the current pathname. Prefix it explicitly (trailing slash
// stripped; root stays `/`) so `push({ query })` with no pathname stays on
// the exact current path.
// Exported for unit tests (see router.test.ts) — not part of the Next surface.
export function resolveSearchOrHashOnlyTarget(to: string, currentPathname: string): string {
  if (!to.startsWith('?') && !to.startsWith('#')) return to
  let base = currentPathname || '/'
  if (base.length > 1 && base.endsWith('/')) base = base.slice(0, -1)
  return `${base}${to}`
}

// Next resolves a pathname-less UrlObject against the *current route
// pattern*, re-consuming dynamic params from `query` into the path — e.g.
// `push({ query: { ...router.query, preset } })` on `/project/[ref]/advisors`
// stays on `/project/<ref>/advisors?preset=…`. Because the shim's
// `router.query` merges path params in (Next shape), skipping this would leak
// `ref`/`id` into the query string. Params the caller didn't include are
// backfilled from the current route's params (minus TanStack's `_splat`,
// which no bracket segment can consume) so partial `{ query }` pushes stay
// on-page instead of producing empty path segments.
// Exported for unit tests (see router.test.ts) — not part of the Next surface.
export function withDefaultPathname(
  url: string | UrlObject,
  currentPathPattern: string,
  currentParams: Record<string, QueryValue>
): string | UrlObject {
  if (typeof url === 'string' || url.pathname != null) return url
  if (!url.query || typeof url.query !== 'object') return url
  const { _splat, ...paramsWithoutSplat } = currentParams
  return {
    ...url,
    pathname: currentPathPattern,
    query: { ...paramsWithoutSplat, ...url.query },
  }
}

// Exported for unit tests (see router.test.ts) — not part of the Next surface.
export function resolveUrl(url: string | UrlObject): string {
  if (typeof url === 'string') return url
  let pathname = url.pathname ?? ''
  let query = url.query
  // Interpolate named params into the path when query is a record — a raw query
  // string can't fill `[param]` placeholders, so leave it untouched.
  if (query && typeof query === 'object') {
    const interpolated = interpolatePathname(pathname, query)
    pathname = interpolated.pathname
    query = interpolated.query
  }
  const search = url.search ?? serializeQuery(query)
  const hash = url.hash ? (url.hash.startsWith('#') ? url.hash : `#${url.hash}`) : ''
  return `${pathname}${search}${hash}`
}

// Studio code occasionally constructs `router.push` targets via
// `new URL().toString()` (e.g. `buildTableEditorUrl`), producing fully
// qualified `http://localhost:8082/dashboard/project/.../editor/123?...`
// strings — origin + basePath + path. Next's router tolerated both by
// treating same-origin absolute URLs as relative paths AND understanding
// basePath was already in the input.
//
// TanStack Router needs `to` to be basepath-relative — given
// `basepath: '/dashboard'` and `to: '/foo'`, it produces `/dashboard/foo`.
// So we strip the origin AND the basePath when present; otherwise
// `router.push('/dashboard/...')` would double-prefix to
// `/dashboard/dashboard/...`. Mirrors the equivalent logic in
// `splitInternalUrl` (@/lib/internal-url). Cross-origin URLs pass through
// untouched so TanStack hands them to the browser as external.
const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Strip a leading basePath segment from a path-shape URL (no origin).
// Mirrors what Next's pages-router does for `asPath`. Used by both
// `useRouter().asPath` and the push/replace path-normalisation pipeline.
function stripBasePath(pathish: string): string {
  if (!NEXT_PUBLIC_BASE_PATH) return pathish
  if (pathish === NEXT_PUBLIC_BASE_PATH) return '/'
  if (pathish.startsWith(`${NEXT_PUBLIC_BASE_PATH}/`)) {
    return pathish.slice(NEXT_PUBLIC_BASE_PATH.length)
  }
  return pathish
}

function toRelativeSameOrigin(url: string): string {
  let pathname: string
  let search = ''
  let hash = ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (typeof window === 'undefined' || !window.location) return url
    try {
      const parsed = new URL(url)
      if (parsed.origin !== window.location.origin) return url
      pathname = parsed.pathname
      search = parsed.search
      hash = parsed.hash
    } catch {
      return url
    }
  } else {
    // Relative input — split on the first `?` / `#` so we can strip a
    // basePath segment from the pathname only.
    const queryIdx = url.indexOf('?')
    const hashIdx = url.indexOf('#')
    const splitIdx =
      [queryIdx, hashIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? url.length
    pathname = url.slice(0, splitIdx)
    const rest = url.slice(splitIdx)
    const qEnd = rest.indexOf('#')
    if (rest.startsWith('?')) {
      search = qEnd >= 0 ? rest.slice(0, qEnd) : rest
      hash = qEnd >= 0 ? rest.slice(qEnd) : ''
    } else if (rest.startsWith('#')) {
      hash = rest
    }
  }
  return `${stripBasePath(pathname)}${search}${hash}`
}

// Next's pages-router passes a TransitionOptions bag as the 3rd arg to
// push/replace. We accept the shape but ignore every field — TanStack has
// no direct equivalent for any of them (shallow, locale, scroll,
// unstable_skipClientCache). Notably `shallow` is a no-op here, NOT a
// push-vs-replace signal: callers pass `push(url, as, { shallow: true })`
// expecting a normal history push (e.g. useUrlState, MonacoEditor). Whether
// a navigation replaces is decided solely by which method is called
// (push vs replace) via the internal `_replace` flag below.
type TransitionOptions = {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
  unstable_skipClientCache?: boolean
}

type PrefetchOptions = {
  priority?: boolean
  locale?: string | false
  unstable_skipClientCache?: boolean
}

export function useRouter() {
  const router = useTanStackRouter()
  const location = useLocation()
  const matches = useMatches()
  const params = useParams({ strict: false })
  const search = useSearch({ strict: false })

  return useMemo(() => {
    const leafRouteId = matches[matches.length - 1]?.routeId ?? location.pathname
    const pathPattern = toNextPathPattern(leafRouteId)

    // Both push and replace accept Next's (url, as?, options?) signature.
    // `as` is the legacy alias path (mostly obsolete in modern Next; ignored
    // here — the resolved `url` is what we navigate to). Returns
    // Promise<boolean> matching Next; TanStack's navigate doesn't surface
    // a success boolean so we always resolve to true.
    const navigate = async (
      url: string | UrlObject,
      _as?: string | UrlObject,
      // `_replace` is an internal flag set by the `replace()` method below.
      // It's intentionally not part of Next's public TransitionOptions.
      options?: TransitionOptions & { _replace?: boolean }
    ): Promise<boolean> => {
      // `location.pathname` is already basepath-stripped by TanStack, so the
      // prefixed target stays basepath-relative like every other `to`.
      const target = resolveSearchOrHashOnlyTarget(
        // `useParams({ strict: false })` types as possibly-undefined; treat
        // "no params" as an empty record for backfilling.
        toRelativeSameOrigin(resolveUrl(withDefaultPathname(url, pathPattern, params ?? {}))),
        location.pathname
      )
      // Never embed `?query`/`#hash` inside TanStack's `to` — router-core
      // runs the whole string through path interpolation, which percent-
      // decodes it and strips control characters (dropping `%0A` newlines
      // from values like the Logs Explorer's `s` SQL param). Split into
      // { to, search, hash } instead; the target is already relative and
      // basepath-stripped, so splitInternalUrl's own origin/basePath
      // normalisation is a no-op here. `search: {}` clears the query,
      // matching Next's push-without-query semantics; same for `hash: ''`.
      const { to, search, hash } = splitInternalUrl(target)
      await router.navigate({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to: to as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search: (search ?? {}) as any,
        hash: hash ?? '',
        replace: options?._replace,
      })
      return true
    }

    return {
      // ---- state ----
      pathname: pathPattern,
      // Next's pages-router exposes `route` and `pathname` as the same value
      // — the route pattern with bracketed dynamic segments. Some studio
      // code (e.g. AppLayout/BranchLink, AppLayout/ProjectDropdown) reads
      // `router.route` specifically; without this it's `undefined` and
      // downstream `.split('/')` calls crash.
      route: pathPattern,
      // Route params take precedence over search params of the same name,
      // matching Next's pages-router req.query merge order.
      query: { ...search, ...params },
      // Next's pages-router `asPath` is path + query + hash *without* the
      // origin and *without* the configured `basePath`
      // (https://nextjs.org/docs/pages/api-reference/functions/use-router).
      // Studio code relies on the no-basePath shape — e.g.
      // OrganizationSettingsLayout compares `currentPath === '/org/<slug>/
      // general'` for the side-nav active state, with section hrefs that
      // never include `/dashboard`. Returning a basepath-prefixed value
      // breaks every such strict-equality check.
      asPath: stripBasePath(location.href),
      // Mirror Next's pages-router contract for `basePath`:
      //   - no basePath configured → '' (empty string)
      //   - configured            → '/dashboard' (leading slash, no trailing)
      //
      // TanStack stores the raw `basepath` option without normalising:
      // `undefined` becomes '/' (its internal default), 'dashboard' stays
      // 'dashboard', '/dashboard/' stays '/dashboard/'. Studio code then
      // does `${router.basePath}/img/...` and trips on every non-Next
      // shape ('/' → '//img/...' protocol-relative; 'dashboard' →
      // 'dashboard/img/...' relative-to-current-path; '/dashboard/' →
      // '/dashboard//img/...' double slash).
      basePath: toNextBasePath(router.basepath),
      // TanStack resolves params/search synchronously on render, so the
      // pages-router "is the dynamic param ready yet?" flag is always
      // true here. (In Next this can be false during the very first
      // render of a dynamic page.)
      isReady: true,
      // No equivalent under TanStack — surface as static `false` so call
      // sites that read these don't crash. Next-only features.
      isFallback: false,
      isPreview: false,
      isLocaleDomain: false,
      // i18n routing isn't wired through TanStack here. Return undefined
      // for the active locale and an empty list for the rest — matches
      // a Next app that has no i18n config.
      locale: undefined as string | undefined,
      locales: undefined as string[] | undefined,
      defaultLocale: undefined as string | undefined,
      domainLocales: undefined as Array<{ domain: string; defaultLocale: string }> | undefined,

      // ---- navigation ----
      push: (url: string | UrlObject, as?: string | UrlObject, options?: TransitionOptions) =>
        navigate(url, as, options),
      replace: (url: string | UrlObject, as?: string | UrlObject, options?: TransitionOptions) =>
        navigate(url, as, { ...options, _replace: true }),
      reload: () => {
        if (typeof window !== 'undefined') window.location.reload()
      },
      back: () => {
        if (typeof window !== 'undefined') window.history.back()
      },
      forward: () => {
        if (typeof window !== 'undefined') window.history.forward()
      },
      prefetch: async (
        url: string,
        _asPath?: string,
        _options?: PrefetchOptions
      ): Promise<void> => {
        try {
          // Split like navigate() above so a query string in the href
          // preloads the real target instead of a path-mangled one.
          const { to, search, hash } = splitInternalUrl(toRelativeSameOrigin(url))
          await router.preloadRoute({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to: to as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: (search ?? {}) as any,
            hash: hash ?? '',
          })
        } catch {
          // Next's prefetch is fire-and-forget; swallow resolution errors
          // (e.g. unknown route) so callers don't have to guard.
        }
      },
      // Next-only escape hatch for popstate handling. Not wired up; accept
      // and discard the callback so call sites compile and run without
      // throwing. Callers that *rely* on this (none currently in studio)
      // would need a real implementation.
      beforePopState: (_cb: (state: unknown) => boolean) => {},

      // ---- events ----
      events: getRouterEventsProxy(router),
    }
  }, [router, location.href, location.pathname, matches, params, search])
}

// Normalise an optional-catch-all route's params across both frameworks.
//
// Next's `[[...name]]` surfaces the trailing path as `query.name: string[]`,
// while TanStack's splat (`$`) surfaces it as `query._splat: string`. The
// shim can't rename `_splat` to the Next param name on its own — that name
// only exists in the Next page filename and never reaches the router — so
// the caller passes it. Returns the trailing path as a string[] plus the
// remaining query params (with the catch-all keys stripped) for building
// query strings. Shared by every migrated catch-all page so the logic lives
// in one place.
export function parseCatchAllRoute(
  query: Record<string, string | string[] | undefined>,
  paramName: string
): {
  segments: string[] | undefined
  queryParams: Record<string, string | string[] | undefined>
} {
  const { [paramName]: raw, _splat, ...queryParams } = query
  const segments = Array.isArray(raw)
    ? raw
    : typeof _splat === 'string' && _splat
      ? _splat.split('/')
      : undefined
  return { segments, queryParams }
}

// Module-scope singleton — Next exposes the same proxy via
// `import router from 'next/router'`. We have one consumer
// (Support/DiscordCTACard) that reads `router.basePath` at render time
// outside of a hook context, so we surface the env-derived basePath
// directly. Push/replace/etc. fall through to `window.location` to keep
// future module-scope navigations safe; nothing in studio uses them
// today.
const singletonBasePath = toNextBasePath(
  // Read both the TanStack and Next env names — TanStack also reads
  // VITE_BASE_URL but the studio config writes NEXT_PUBLIC_BASE_PATH.
  process.env.NEXT_PUBLIC_BASE_PATH
)

const singletonRouter = {
  basePath: singletonBasePath,
  pathname: '',
  route: '',
  query: {} as Record<string, string | string[] | undefined>,
  asPath: '',
  isReady: true,
  isFallback: false,
  isPreview: false,
  isLocaleDomain: false,
  push: async (url: string | UrlObject): Promise<boolean> => {
    if (typeof window !== 'undefined') window.location.assign(resolveUrl(url))
    return true
  },
  replace: async (url: string | UrlObject): Promise<boolean> => {
    if (typeof window !== 'undefined') window.location.replace(resolveUrl(url))
    return true
  },
  reload: () => {
    if (typeof window !== 'undefined') window.location.reload()
  },
  back: () => {
    if (typeof window !== 'undefined') window.history.back()
  },
  forward: () => {
    if (typeof window !== 'undefined') window.history.forward()
  },
  prefetch: async () => {},
  beforePopState: (_cb: (state: unknown) => boolean) => {},
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
}

// eslint-disable-next-line no-restricted-exports
export default singletonRouter
