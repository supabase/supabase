/**
 * Hand-off store for generated pages opened as an Explorer tab.
 *
 * DELIBERATELY IN MEMORY ONLY. Unlike Explorer query drafts and notebooks, nothing here is
 * written to localStorage or to the platform, for two reasons:
 *
 * 1. A generated page is model output carrying SQL that was approved by one explicit user
 *    gesture. Persisting it would create a stored, replayable artifact with no approval
 *    attached to it — exactly the thing the approval boundary exists to prevent.
 * 2. The entries hold already-promoted `SafeSqlFragment` / `SafeLogSqlFragment` values,
 *    which must never round-trip through storage and come back still branded.
 *
 * So a generated-page tab lives for as long as the SPA session does. After a hard reload
 * its entry is gone and the tab says so, which is why `generated-page` is registered as an
 * ephemeral tab type (see `state/tabs.tsx`).
 */
import { proxy, ref, useSnapshot } from 'valtio'

import type { ApprovedGeneratedPageQueries } from '@/components/interfaces/Explorer/GeneratedPage/generated-page.utils'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'

export type ExplorerGeneratedPage = {
  id: string
  projectRef: string
  page: RenderPageInput
  /**
   * The approval carried over from the surface that obtained it. Wrapped in valtio's `ref`
   * so the branded fragments inside are never proxied, cloned, or made enumerable to a
   * snapshot consumer.
   */
  approvedQueries: ApprovedGeneratedPageQueries
  createdAt: number
}

type ExplorerGeneratedPageState = {
  pages: Record<string, ExplorerGeneratedPage>
}

export const explorerGeneratedPageState = proxy<ExplorerGeneratedPageState>({ pages: {} })

export function addExplorerGeneratedPage({
  id,
  projectRef,
  page,
  approvedQueries,
}: {
  id: string
  projectRef: string
  page: RenderPageInput
  approvedQueries: ApprovedGeneratedPageQueries
}) {
  explorerGeneratedPageState.pages[id] = {
    id,
    projectRef,
    page: ref(page),
    approvedQueries: ref(approvedQueries),
    createdAt: Date.now(),
  }
}

export function removeExplorerGeneratedPage(id: string) {
  delete explorerGeneratedPageState.pages[id]
}

/** Returns the entry only when it belongs to the project currently being viewed. */
export function getExplorerGeneratedPage({
  id,
  projectRef,
}: {
  id: string | undefined
  projectRef: string | undefined
}): ExplorerGeneratedPage | undefined {
  if (id === undefined || projectRef === undefined) return undefined
  const entry = explorerGeneratedPageState.pages[id]
  return entry?.projectRef === projectRef ? entry : undefined
}

export const useExplorerGeneratedPageSnapshot = () => useSnapshot(explorerGeneratedPageState)
