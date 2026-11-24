import {
  Link as TanStackLink,
  useMatches,
  useRouterState,
  useSearch,
  useParams as useTanStackParams,
  useRouter as useTanStackRouter,
  type AnyRouter,
} from '@tanstack/react-router'
import {
  DefaultFrameworkImage,
  DefaultFrameworkLink,
  FrameworkProvider,
  resolveStaticImageSrc,
  type FrameworkContextValue,
  type FrameworkImageProps,
  type FrameworkLinkProps,
} from 'common'
import { forwardRef, useMemo, type ForwardedRef, type ReactNode } from 'react'

import { applyBasePath, isAbsoluteUrl, splitInternalUrl, toRoutePattern } from '@/lib/internal-url'

function normalizeParams(
  search: Record<string, unknown> | undefined,
  params: Record<string, unknown> | undefined
): Record<string, string | string[] | undefined> {
  const merged = { ...search, ...params }
  const normalized: Record<string, string | string[] | undefined> = {}
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'string') {
      normalized[key] = value
    } else if (Array.isArray(value)) {
      normalized[key] = value.map(String)
    } else if (value !== undefined && value !== null) {
      normalized[key] = String(value)
    }
  }
  return normalized
}

function resolveSearchOrHashOnlyTarget(
  target: string,
  currentPathname: string,
  currentSearch: string
): string {
  if (target.startsWith('?')) {
    return `${currentPathname}${target}`
  }
  if (target.startsWith('#')) {
    return `${currentPathname}${currentSearch}${target}`
  }
  return target
}

const StudioLink = forwardRef(function StudioLink(
  props: FrameworkLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const { href, prefetch, replace, scroll: _scroll, shallow: _shallow, children, ...rest } = props
  const { currentPathname, currentSearch } = useRouterState({
    select: (state) => {
      const committed = state.resolvedLocation ?? state.location
      return {
        currentPathname: committed.pathname,
        currentSearch: committed.searchStr,
      }
    },
  })
  const resolvedHref = resolveSearchOrHashOnlyTarget(href, currentPathname, currentSearch)
  const { to, search, hash } = splitInternalUrl(resolvedHref)

  if (isAbsoluteUrl(to)) {
    return <DefaultFrameworkLink ref={ref} {...props} />
  }

  const preload = prefetch === false ? false : prefetch ? 'intent' : undefined

  return (
    <TanStackLink<AnyRouter, string>
      to={to}
      search={search as never}
      hash={hash}
      replace={replace}
      preload={preload}
      ref={ref}
      {...rest}
    >
      {children}
    </TanStackLink>
  )
})

function StudioImage({ src, ...props }: FrameworkImageProps) {
  return <DefaultFrameworkImage {...props} src={applyBasePath(resolveStaticImageSrc(src))} />
}

export function StudioFrameworkProvider({ children }: { children: ReactNode }) {
  const router = useTanStackRouter()
  const committedLocation = useRouterState({
    select: (state) => state.resolvedLocation ?? state.location,
  })
  // `resolvedLocation` stays unset until the first load commits. Before then `location` can already
  // point at a redirect target while the initial matches are still pending.
  const isReady = useRouterState({ select: (state) => state.resolvedLocation !== undefined })
  const leafRouteId =
    useMatches({ select: (matches) => matches[matches.length - 1]?.routeId }) ??
    committedLocation.pathname
  const routeParams = useTanStackParams({ strict: false })
  const searchParams = useSearch({ strict: false })

  const value = useMemo<FrameworkContextValue>(() => {
    const pathname = toRoutePattern(leafRouteId)
    const asPath = committedLocation.href
    const currentPathname = committedLocation.pathname
    const currentSearch = committedLocation.searchStr
    const params = normalizeParams(
      searchParams as Record<string, unknown> | undefined,
      routeParams as Record<string, unknown> | undefined
    )

    return {
      Link: StudioLink,
      Image: StudioImage,
      pathname,
      asPath,
      isReady,
      params,
      push: async (path: string) => {
        const target = resolveSearchOrHashOnlyTarget(path, currentPathname, currentSearch)
        const { to, search, hash } = splitInternalUrl(target)
        if (isAbsoluteUrl(to)) {
          const href = to.startsWith('//') ? new URL(to, window.location.href).href : to
          await router.navigate({ href, reloadDocument: true })
          return
        }
        await router.navigate<AnyRouter, string>({
          to,
          search: search ?? {},
          hash: hash ?? '',
        })
      },
    }
  }, [
    committedLocation.href,
    committedLocation.pathname,
    committedLocation.searchStr,
    isReady,
    leafRouteId,
    routeParams,
    router,
    searchParams,
  ])

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}
