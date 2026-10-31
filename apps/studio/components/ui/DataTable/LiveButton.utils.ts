export const LIVE_POLL_BASE_INTERVAL_MS = 10_000
export const LIVE_POLL_MAX_INTERVAL_MS = 60_000
export const LIVE_MODE_IDLE_TIMEOUT_MS = 15 * 60_000

/**
 * Delay before the next live-mode poll. Doubles after each poll that finds no new rows
 * (10s, 20s, 40s), capped at 60s, so quiet projects are polled less often.
 */
export function getLivePollDelay(consecutiveEmptyPolls: number): number {
  if (!Number.isFinite(consecutiveEmptyPolls) || consecutiveEmptyPolls <= 0) {
    return LIVE_POLL_BASE_INTERVAL_MS
  }
  return Math.min(
    LIVE_POLL_BASE_INTERVAL_MS * 2 ** Math.floor(consecutiveEmptyPolls),
    LIVE_POLL_MAX_INTERVAL_MS
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Whether a live-mode poll found no new rows. A poll is `fetchPreviousPage`, which prepends
 * the new page, so its result's first page holds the rows that poll returned. A poll's time
 * range overlaps rows already loaded, so it usually returns rows the table already has: only
 * rows whose ids aren't in the older pages count as new. Anything unrecognized counts as new,
 * so polling never slows down on unexpected data.
 */
export function hasNoNewRows(result: unknown): boolean {
  if (!isRecord(result) || !isRecord(result.data)) return false
  const pages = result.data.pages
  if (!Array.isArray(pages) || pages.length === 0) return false
  const [newestPage, ...olderPages] = pages
  if (!isRecord(newestPage) || !Array.isArray(newestPage.data)) return false

  const loadedIds = new Set<string>()
  for (const page of olderPages) {
    if (!isRecord(page) || !Array.isArray(page.data)) return false
    for (const row of page.data) {
      if (isRecord(row) && typeof row.id === 'string') loadedIds.add(row.id)
    }
  }
  return newestPage.data.every(
    (row) => isRecord(row) && typeof row.id === 'string' && loadedIds.has(row.id)
  )
}
