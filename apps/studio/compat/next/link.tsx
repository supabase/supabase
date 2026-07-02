import { Link as TanStackLink } from '@tanstack/react-router'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type AnchorHTMLAttributes,
  type ForwardedRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

// Next's Link accepts either a string `href` or a `UrlObject`
// ({pathname, query, hash}). Workspace source does both — flatten
// `UrlObject` into `pathname?search#hash` first so the TanStack `to`
// prop (which only takes a string) works for either input.

type QueryValue = string | number | boolean | string[] | undefined | null
type UrlObject = {
  pathname?: string
  query?: Record<string, QueryValue> | string
  hash?: string
  search?: string
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | UrlObject
  children?: ReactNode
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean | null | 'auto'
  locale?: string | false
  legacyBehavior?: boolean
  // Next-specific props with no TanStack equivalent; accepted and dropped.
  as?: string | UrlObject
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

function resolveHref(href: string | UrlObject): string {
  if (typeof href === 'string') return href
  const pathname = href.pathname ?? ''
  const search = href.search ?? serializeQuery(href.query)
  const hash = href.hash ? (href.hash.startsWith('#') ? href.hash : `#${href.hash}`) : ''
  return `${pathname}${search}${hash}`
}

// Inlined at build time via Vite's `define`. Must agree with Vite `base`
// and `tanstackStart({ router: { basepath } })`. Empty string when no
// basePath is configured. Used to strip a duplicate prefix in
// `splitInternalUrl` below — see the comment there.
const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// TanStack Link's `to` prop is a route-pattern path; query params and hash
// must be passed separately via `search` / `hash`. Studio code (and Next's
// own contract) routinely passes one of three href shapes:
//   1. a relative path like `/project/abc/editor/123?schema=public`
//   2. a same-origin absolute URL produced by `new URL(...).toString()`,
//      e.g. `http://localhost:8082/project/abc/editor/123?schema=public`
//      (this is what `buildTableEditorUrl` does)
//   3. a genuinely external URL like `https://supabase.com/docs`.
//
// If we forward any of these straight through to TanStack as `to`, TanStack
// either fails to match a known route pattern (#1 with query) or treats
// the whole thing as external (#2) and falls back to native browser
// navigation — which the user sees as a full page reload.
//
// Split into three parts: pathname, search, hash. Same-origin absolute
// URLs are normalised to a relative path. Cross-origin URLs are left
// alone so TanStack's external-link path handles them.
//
// basePath quirk: TanStack's `to` is **basepath-relative** — given
// `basepath: '/dashboard'` and `to: '/foo'`, TanStack builds the href
// `/dashboard/foo`. Next's contract treats `href` as the **full path
// from app root including basePath**, and studio code routinely
// pre-prefixes BASE_PATH (e.g. `buildTableEditorUrl` calls
// `new URL(`${BASE_PATH}/project/.../editor/...`, location.origin)`).
// Forwarding the BASE_PATH-prefixed pathname as `to` makes TanStack
// double-prefix it (`/dashboard/dashboard/project/...`). Strip the
// basePath when we see it, so what we hand TanStack is always
// basepath-relative.
function splitInternalUrl(url: string): {
  to: string
  search?: Record<string, string>
  hash?: string
} {
  // Try to detect cross-origin absolute URLs cheaply before paying for a
  // full parse. Protocol-relative URLs (`//host/...`) are always external.
  if (url.startsWith('//')) {
    return { to: url }
  }

  // Use the document origin as the parse base so relative inputs resolve.
  // SSR has no `location`; fall back to a placeholder host that won't ever
  // collide with a real one.
  const base =
    typeof window !== 'undefined' && window.location ? window.location.origin : 'http://_/'

  let parsed: URL
  try {
    parsed = new URL(url, base)
  } catch {
    return { to: url }
  }

  // Cross-origin → leave for TanStack to handle as external.
  if (
    typeof window !== 'undefined' &&
    window.location &&
    parsed.origin !== window.location.origin
  ) {
    return { to: url }
  }

  let pathname = parsed.pathname
  // Strip a leading basePath segment so we hand TanStack a basepath-
  // relative path. Match `/dashboard` exactly OR `/dashboard/...`; don't
  // strip a coincidental prefix like `/dashboard-other`.
  if (
    NEXT_PUBLIC_BASE_PATH &&
    (pathname === NEXT_PUBLIC_BASE_PATH || pathname.startsWith(`${NEXT_PUBLIC_BASE_PATH}/`))
  ) {
    pathname = pathname.slice(NEXT_PUBLIC_BASE_PATH.length) || '/'
  }

  const search = Object.fromEntries(parsed.searchParams)
  const hash = parsed.hash || undefined
  return {
    to: pathname,
    search: Object.keys(search).length > 0 ? search : undefined,
    hash,
  }
}

// Next: prefetch=true|"auto" → eagerly preload; false → never; default
// in production = true. TanStack's preload values are "intent" (on hover/
// focus), "viewport" (when entering viewport), "render" (immediately),
// or false. "intent" is the closest behavioural match to Next's default
// hover-prefetch behaviour.
function mapPrefetch(prefetch: LinkProps['prefetch']): 'intent' | false | undefined {
  if (prefetch === false) return false
  if (prefetch === true || prefetch === 'auto') return 'intent'
  return undefined
}

const Link = forwardRef(function Link(
  {
    href,
    as: _as,
    replace,
    scroll: _scroll,
    shallow: _shallow,
    passHref,
    prefetch,
    locale: _locale,
    legacyBehavior,
    children,
    onClick,
    ...rest
  }: LinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const resolved = resolveHref(href)
  const { to, search, hash } = splitInternalUrl(resolved)
  const preload = mapPrefetch(prefetch)

  // Next's `legacyBehavior` (and `passHref` with a custom anchor child)
  // expects the consumer's child element to *be* the anchor — the parent
  // <Link> shouldn't render its own. We approximate by cloning the
  // single child element and stamping `href` plus a click handler that
  // fires TanStack navigation. Modifier-clicks / middle-clicks fall
  // through to the browser the same way Next does.
  if (legacyBehavior && isValidElement(children)) {
    const child = children as ReactElement<{
      href?: string
      onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
      ref?: Ref<HTMLAnchorElement>
    }>
    return (
      <TanStackLink
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={to as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search={search as any}
        hash={hash}
        replace={replace}
        preload={preload}
        // TanStack Link supports a function child for custom rendering.
        // Cast through unknown to bridge the typing — runtime contract is
        // the same.
      >
        {(() => {
          // Inside TanStackLink's child slot we still get an <a> by default;
          // when legacyBehavior is true the consumer wants to control the
          // anchor themselves. Render the cloned child with merged props.
          return cloneElement(child, {
            href: resolved,
            ref,
            onClick: (e: MouseEvent<HTMLAnchorElement>) => {
              child.props.onClick?.(e)
              onClick?.(e)
            },
          })
        })()}
      </TanStackLink>
    )
  }

  // `passHref` without `legacyBehavior` is a no-op in modern Next when
  // the child is anything other than an `<a>` — the wrapping <Link>
  // renders the anchor and the `href` attribute lands on it. We get the
  // same outcome by passing children through TanStackLink, which also
  // renders an anchor.
  void passHref

  return (
    <TanStackLink
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search={search as any}
      hash={hash}
      replace={replace}
      preload={preload}
      ref={ref}
      onClick={onClick}
      {...rest}
    >
      {children}
    </TanStackLink>
  )
})

// eslint-disable-next-line no-restricted-exports
export default Link
