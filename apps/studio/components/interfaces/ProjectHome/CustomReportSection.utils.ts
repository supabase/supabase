import type { Content } from '@/data/content/content-query'

export type SnippetSelectionAction = 'already-added' | 'confirm-share' | 'add'

export function resolveSnippetSelection(
  snippet: { visibility: Content['visibility'] },
  isAlreadyInReport: boolean
): SnippetSelectionAction {
  if (isAlreadyInReport) return 'already-added'
  if (snippet.visibility === 'user') return 'confirm-share'
  return 'add'
}
