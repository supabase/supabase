import {
  useLocation,
  useMatches,
  useParams as useTanStackParams,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'
import { useMemo } from 'react'

import { splitInternalUrl } from '@/lib/internal-url'

// `next/navigation` is the App Router hook surface (Next 13+). Studio is
// still pages-based, so most of these are entry-points that arrive via
// stray imports or shared packages — we keep the surface comprehensive
// to avoid call sites silently getting `undefined` for something Next
// would have provided.

type NavigateOptions = {
  scroll?: boolean
}

type PrefetchOptions = {
  kind?: 'auto' | 'full' | 'temporary'
}

export function usePathname(): string | null {
  return useLocation().pathname
}

export function useRouter() {
  const router = useTanStackRouter()

  return useMemo(
    () => ({
      // Split query/hash out of the href — embedding them in TanStack's
      // `to` runs the whole string through path interpolation, which
      // percent-decodes it and strips control characters from query values
      // (see @/lib/internal-url). `search: {}` / `hash: ''` clear stale
      // state, matching Next's full-href navigation semantics.
      push: (href: string, _options?: NavigateOptions) => {
        const { to, search, hash } = splitInternalUrl(href)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.navigate({ to: to as any, search: (search ?? {}) as any, hash: hash ?? '' })
      },
      replace: (href: string, _options?: NavigateOptions) => {
        const { to, search, hash } = splitInternalUrl(href)
        router.navigate({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to: to as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          search: (search ?? {}) as any,
          hash: hash ?? '',
          replace: true,
        })
      },
      // App Router's refresh() refetches the current route's data without
      // re-mounting the React tree. Closest TanStack equivalent is
      // invalidating the active matches.
      refresh: () => {
        router.invalidate()
      },
      back: () => {
        if (typeof window !== 'undefined') window.history.back()
      },
      forward: () => {
        if (typeof window !== 'undefined') window.history.forward()
      },
      prefetch: (href: string, _options?: PrefetchOptions) => {
        const { to, search, hash } = splitInternalUrl(href)
        router
          .preloadRoute({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to: to as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: (search ?? {}) as any,
            hash: hash ?? '',
          })
          .catch(() => {
            // Match Next's fire-and-forget contract.
          })
      },
    }),
    [router]
  )
}

export function useSearchParams(): URLSearchParams {
  const location = useLocation()
  // App Router returns a ReadonlyURLSearchParams; URLSearchParams is
  // structurally compatible for read access.
  return useMemo(() => new URLSearchParams(location.searchStr ?? ''), [location.searchStr])
}

export function useParams<
  T extends Record<string, string | string[]> = Record<string, string>,
>(): T {
  // App Router's useParams() returns a flat object of dynamic segments.
  // TanStack's strict-false useParams returns the same shape merged
  // across matches.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useTanStackParams({ strict: false } as any) as T
}

// `useSelectedLayoutSegment(parallelRoute?)` returns the active leaf
// segment one level below the layout that calls it. We approximate by
// returning the trailing URL segment of the active route, which is what
// most studio callers want when they drift into this hook.
export function useSelectedLayoutSegment(_parallelRouteKey?: string): string | null {
  const matches = useMatches()
  const leafRouteId = matches[matches.length - 1]?.routeId
  if (!leafRouteId) return null
  const segments = leafRouteId.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  return last ?? null
}

export function useSelectedLayoutSegments(_parallelRouteKey?: string): string[] {
  const matches = useMatches()
  const leafRouteId = matches[matches.length - 1]?.routeId
  if (!leafRouteId) return []
  return leafRouteId.split('/').filter(Boolean)
}

// Next's RedirectType enum. App Router uses these as string values.
export const RedirectType = {
  push: 'push',
  replace: 'replace',
} as const
export type RedirectType = (typeof RedirectType)[keyof typeof RedirectType]

// Next signals these by throwing internal symbols that Next's renderer
// catches. We have no equivalent renderer in TanStack, so we use the
// closest behavioural match: `redirect` does a client-side navigation
// and then throws so the calling component stops rendering on the same
// tick (mirroring Next's "function never returns" contract). Callers
// that catch and ignore will get unexpected behaviour — same as in Next.
const NEXT_NOT_FOUND = Symbol.for('next.not-found')
const NEXT_REDIRECT = Symbol.for('next.redirect')

export function notFound(): never {
  const err = new Error('NEXT_NOT_FOUND') as Error & { digest?: symbol }
  err.digest = NEXT_NOT_FOUND
  throw err
}

export function redirect(url: string, type: RedirectType = RedirectType.replace): never {
  if (typeof window !== 'undefined') {
    if (type === RedirectType.push) {
      window.location.assign(url)
    } else {
      window.location.replace(url)
    }
  }
  const err = new Error(`NEXT_REDIRECT;${type};${url}`) as Error & { digest?: symbol }
  err.digest = NEXT_REDIRECT
  throw err
}

export function permanentRedirect(url: string, type: RedirectType = RedirectType.replace): never {
  // Next distinguishes permanent vs temporary at the framework level
  // (different HTTP status when triggered server-side). Client-side
  // there's no observable difference; we delegate to redirect().
  return redirect(url, type)
}
