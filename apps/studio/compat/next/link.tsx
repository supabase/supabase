import { Link as TanStackLink } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

// Next's Link accepts either a string `href` or a `UrlObject` ({pathname, query, hash}).
// Workspace source does both — `pages/sign-in.tsx` uses the object form to forward
// `router.query` into the SSO/sign-up links. The TanStackLink `to` prop takes a
// route string, so we flatten `UrlObject` into `pathname?search#hash` first.

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
  // Next-specific props that have no TanStack equivalent; we drop them silently.
  as?: string | UrlObject
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean | null
  locale?: string | false
  legacyBehavior?: boolean
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

export default function Link({
  href,
  as: _as,
  scroll: _scroll,
  shallow: _shallow,
  passHref: _passHref,
  prefetch: _prefetch,
  locale: _locale,
  legacyBehavior: _legacyBehavior,
  children,
  ...rest
}: LinkProps) {
  const to = resolveHref(href)
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TanStackLink to={to as any} {...(rest as any)}>
      {children}
    </TanStackLink>
  )
}
