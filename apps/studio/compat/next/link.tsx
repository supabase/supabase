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

import { splitInternalUrl } from '@/lib/internal-url'

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

// TanStack Link's `to` prop is a route-pattern path; query params and hash
// must be passed separately via `search` / `hash`. If we forward an href
// straight through to TanStack as `to`, TanStack either mangles the query
// (path interpolation percent-decodes it and strips control characters) or
// treats a same-origin absolute URL as external and falls back to native
// browser navigation — which the user sees as a full page reload. Splitting
// (plus origin/basePath normalisation) lives in `splitInternalUrl`
// (@/lib/internal-url), shared with the next/router shim.

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
