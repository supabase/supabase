import type { AnchorHTMLAttributes, ReactElement } from 'react'

// The search data shapes belong to the hook that produces them, so they're re-exported
// from there instead of redefined. Type-only: this package never imports `common` at runtime.
export type {
  DocsSearchV2Result as SearchResult,
  DocsSearchV2State as SearchState,
} from 'common/hooks/useDocsSearchV2'

export interface SearchLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

/**
 * Renders the anchor of a result. Defaults to a plain `<a>`; return a framework link
 * (e.g. `next/link`) to get client-side navigation. Must return a single element, which
 * receives the result's props, handlers and ref.
 */
export type SearchRenderLink = (props: SearchLinkProps) => ReactElement

/** Every piece of user-facing copy, so the components can be reused outside the docs. */
export interface SearchLabels {
  dialogTitle: string
  dialogDescription: string
  inputPlaceholder: string
  inputLabel: string
  resultsLabel: string
  clear: string
  searching: string
  noResults: string
  error: string
  resultCount: (count: number) => string
  navigate: string
  open: string
}
