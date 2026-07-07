// Shared URL-splitting for the Next compat shims (next/link, next/router).
//
// TanStack's `to` is a route-pattern *path*; query params and hash must be
// passed separately via `search` / `hash`. Embedding `?query` (or `#hash`)
// inside `to` is not just a matching problem — router-core runs the whole
// `to` string through path interpolation (`interpolatePath` → `decodePath`
// → `decodeSegment` → `sanitizePathSegment`), which percent-DECODES it and
// then strips control characters (`/[\x00-\x1f\x7f]/`). Any `%0A` (newline)
// in a query value is silently deleted — e.g. the Logs Explorer's multi-line
// SQL in the `s` param loses its newlines, gluing `order by timestamp desc`
// and `limit 5` into one token. So every internal navigation target must be
// split into { to, search, hash } before it reaches TanStack.
//
// Studio code (and Next's own contract) routinely passes one of three
// URL shapes:
//   1. a relative path like `/project/abc/editor/123?schema=public`
//   2. a same-origin absolute URL produced by `new URL(...).toString()`,
//      e.g. `http://localhost:8082/project/abc/editor/123?schema=public`
//      (this is what `buildTableEditorUrl` does)
//   3. a genuinely external URL like `https://supabase.com/docs`.
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
// basepath-relative. (Inputs that are *already* basepath-relative — like
// the router shim's pre-stripped targets — pass through unchanged, since
// no studio route pathname itself starts with the basePath segment.)

import { searchParamsToRecord, type SearchRecord } from './router-search-params'

// Inlined at build time via Vite's `define`. Must agree with Vite `base`
// and `tanstackStart({ router: { basepath } })`. Empty string when no
// basePath is configured.
const NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export interface SplitInternalUrlResult {
  to: string
  search?: SearchRecord
  hash?: string
}

export function splitInternalUrl(url: string): SplitInternalUrlResult {
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

  // Repeated keys must survive as arrays (Object.fromEntries would keep only
  // the last occurrence) — matches the router's Next-style parseSearch shape.
  const search = searchParamsToRecord(parsed.searchParams)
  // URL.hash includes the leading `#`; TanStack's `hash` prop expects the
  // bare fragment and prepends its own `#` (passing it through would
  // navigate to `##section` and break hash-scroll).
  const hash = parsed.hash ? parsed.hash.slice(1) : undefined
  return {
    to: pathname,
    search: Object.keys(search).length > 0 ? search : undefined,
    hash,
  }
}
