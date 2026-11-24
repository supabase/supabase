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
  FrameworkProvider,
  type FrameworkContextValue,
  type FrameworkImageProps,
  type FrameworkLinkProps,
} from 'common'
import { forwardRef, useMemo, type CSSProperties, type ForwardedRef, type ReactNode } from 'react'

import { BASE_PATH } from '@/lib/constants'
import { isAbsoluteUrl, splitInternalUrl } from '@/lib/internal-url'

function toRoutePattern(routeId: string): string {
  const withoutLayoutSegments = routeId.replace(/\/_[a-zA-Z0-9_]+(?=\/|$)/g, '')
  const withBracketParams = withoutLayoutSegments.replace(/\$([a-zA-Z0-9_]+)/g, '[$1]')
  if (withBracketParams === '' || withBracketParams === '/') return '/'
  return withBracketParams.replace(/\/$/, '')
}

function stripBasePath(href: string): string {
  if (!BASE_PATH) return href
  if (href === BASE_PATH) return '/'
  if (href.startsWith(`${BASE_PATH}/`)) return href.slice(BASE_PATH.length)
  if (href.startsWith(`${BASE_PATH}?`) || href.startsWith(`${BASE_PATH}#`)) {
    return `/${href.slice(BASE_PATH.length)}`
  }
  return href
}

function applyBasePath(src: string): string {
  if (!BASE_PATH) return src
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(src) || src.startsWith('//')) return src
  if (src === BASE_PATH || src.startsWith(`${BASE_PATH}/`)) return src
  if (src.startsWith('/')) return `${BASE_PATH}${src}`
  return src
}

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
  {
    href,
    prefetch,
    replace,
    scroll: _scroll,
    shallow: _shallow,
    children,
    ...rest
  }: FrameworkLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const { currentPathname, currentSearch } = useRouterState({
    select: (state) => {
      const committed = state.resolvedLocation ?? state.location
      return {
        currentPathname: committed.pathname,
        currentSearch: committed.searchStr,
      }
    },
  })
  const resolvedHref = resolveSearchOrHashOnlyTarget(
    href,
    stripBasePath(currentPathname),
    currentSearch
  )
  const { to, search, hash } = splitInternalUrl(resolvedHref)

  if (isAbsoluteUrl(to)) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    )
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

function StudioImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority,
  preload: _preload,
  loading,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  overrideSrc: _overrideSrc,
  style,
  fetchPriority,
  ...rest
}: FrameworkImageProps) {
  const rawSrc = typeof src === 'string' ? src : 'default' in src ? src.default.src : src.src
  const resolvedSrc = applyBasePath(rawSrc)
  const finalStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : fetchPriority}
      style={finalStyle}
    />
  )
}

export function StudioFrameworkProvider({ children }: { children: ReactNode }) {
  const router = useTanStackRouter()
  const { committedLocation, isPending } = useRouterState({
    select: (state) => ({
      committedLocation: state.resolvedLocation ?? state.location,
      isPending: state.status === 'pending',
    }),
  })
  const leafRouteId =
    useMatches({ select: (matches) => matches[matches.length - 1]?.routeId }) ??
    committedLocation.pathname
  const routeParams = useTanStackParams({ strict: false })
  const searchParams = useSearch({ strict: false })

  const value = useMemo<FrameworkContextValue>(() => {
    const pathname = toRoutePattern(leafRouteId)
    const asPath = stripBasePath(committedLocation.href)
    const currentPathname = stripBasePath(committedLocation.pathname)
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
      isReady: true,
      isPending,
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
    isPending,
    leafRouteId,
    routeParams,
    router,
    searchParams,
  ])

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}
