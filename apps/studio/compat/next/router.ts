import {
  useLocation,
  useMatches,
  useParams,
  useSearch,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'
import { useMemo } from 'react'

import { getRouterEventsProxy } from './_router-events'

// Next's pages-router exposes `router.pathname` as the route *pattern*
// (e.g. `/project/[ref]/sql/[id]`), not the resolved URL. TanStack's
// route id uses `$param` — convert so legacy code that does
// `router.pathname.endsWith('/sql/[id]')` keeps working.
function toNextPathPattern(routeId: string) {
  return routeId.replace(/\$([a-zA-Z0-9_]+)/g, '[$1]')
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

function resolveUrl(url: string | UrlObject): string {
  if (typeof url === 'string') return url
  const pathname = url.pathname ?? ''
  const search = url.search ?? serializeQuery(url.query)
  const hash = url.hash ? (url.hash.startsWith('#') ? url.hash : `#${url.hash}`) : ''
  return `${pathname}${search}${hash}`
}

// Next's pages-router passes a TransitionOptions bag as the 3rd arg to
// push/replace. We accept the shape but ignore the fields TanStack has
// no direct equivalent for (shallow, locale, scroll, unstable_skipClientCache).
// `replace` is the only one we honour.
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
      options?: TransitionOptions
    ): Promise<boolean> => {
      const to = resolveUrl(url)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await router.navigate({ to: to as any, replace: !!options?.shallow ? false : undefined })
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
      query: { ...params, ...search },
      asPath: location.href,
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
        navigate(url, as, { ...options, shallow: true }),
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await router.preloadRoute({ to: url as any })
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

export default singletonRouter
