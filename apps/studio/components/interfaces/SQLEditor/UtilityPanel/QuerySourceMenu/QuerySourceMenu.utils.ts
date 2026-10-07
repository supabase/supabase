import { type SqlSnippetSource } from '../../querySource'

export type SourceSwitchNavigation = {
  /**
   * `push` opens a new tab (leaving the current snippet intact); `replace`
   * re-flavors the current blank tab in place without a history entry.
   */
  method: 'push' | 'replace'
  url: string
}

/**
 * Decide how switching a snippet's query source should navigate. A snippet's
 * source is immutable, so switching never edits the current snippet:
 *
 * - An existing (materialized) snippet — a saved query, or a new one already
 *   typed into — opens a *fresh* `/sql/new` tab of the target source (`push`), so
 *   its query is never reinterpreted against the wrong backend.
 * - A brand-new, not-yet-materialized blank tab re-flavors in place (`replace`),
 *   so we don't spawn a redundant snippet before anything has been written.
 *
 * Returns `null` when there's nothing to do (no project ref, or the snippet is
 * already on the target source).
 */
export function resolveSourceSwitch({
  ref,
  target,
  currentSource,
  isBlankNewTab,
}: {
  ref: string | undefined
  target: SqlSnippetSource
  currentSource: SqlSnippetSource
  isBlankNewTab: boolean
}): SourceSwitchNavigation | null {
  if (!ref || target === currentSource) return null
  const suffix = target === 'logs' ? '&source=logs' : ''
  return {
    method: isBlankNewTab ? 'replace' : 'push',
    // skip=true bypasses the "load last visited snippet" redirect on /sql/new.
    url: `/project/${ref}/sql/new?skip=true${suffix}`,
  }
}
