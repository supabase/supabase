// Next-style search-param semantics for TanStack Router.
//
// TanStack's default `parseSearch`/`stringifySearch` are JSON-first: parsing
// coerces `"2"` → 2, `"true"` → true and JSON text → objects; stringifying
// JSON-encodes arrays/objects and wraps any string that happens to be valid
// JSON in quotes (`?flag=%22true%22`), and can never emit repeated keys.
// Studio was written against Next's pages-router semantics — every search
// value is a plain string, repeated keys become string arrays — so we
// implement those semantics here and hand them to `createRouter`.
//
// Must stay safe to run during SSR/prerender: no `window`/`document` access.

export type SearchRecord = Record<string, string | string[]>

// Collapse a URLSearchParams into Next's `query` shape: single occurrence →
// string, repeated key → string[] (in order of appearance).
export function searchParamsToRecord(params: URLSearchParams): SearchRecord {
  const result: SearchRecord = {}
  for (const key of params.keys()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) continue
    const all = params.getAll(key)
    result[key] = all.length === 1 ? all[0] : all
  }
  return result
}

// `searchStr` is the raw search string, with or without the leading `?`.
// URLSearchParams handles percent-decoding and `+`-as-space exactly like
// Next's pages router did. No JSON parsing, no type coercion.
export function parseSearch(searchStr: string): SearchRecord {
  if (!searchStr || searchStr === '?') return {}
  return searchParamsToRecord(new URLSearchParams(searchStr))
}

// Values are usually strings/string[] (round-tripped from `parseSearch`),
// but TanStack-native call sites may pass numbers/booleans — serialize those
// with String(), never JSON (no added quotes). null/undefined are omitted.
// Returns '' or a `?`-prefixed string, matching TanStack's contract.
export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue
        params.append(key, String(item))
      }
    } else {
      params.append(key, String(value))
    }
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}
