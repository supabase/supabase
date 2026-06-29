/**
 * Self-hosted snippets derive their id from folder + filename. When an upsert
 * returns the same id, addSnippet is a no-op and removeSnippet would wipe the
 * store entry — use in-place update instead of replace (add/nav/remove).
 */
export type SelfHostedSnippetStoreAction = 'replace' | 'update'

export type SelfHostedSnippetStoreSyncPlan =
  | {
      action: 'replace'
      previousId: string
      nextSnippetId: string
      /** Navigate to nextSnippetId when the user is viewing the moved/renamed snippet. */
      shouldNavigate: boolean
      /** Remove the tab keyed on previousId after a successful replace. */
      shouldRemoveOldTab: boolean
    }
  | {
      action: 'update'
      snippetId: string
    }

export function getSelfHostedSnippetStoreAction(
  previousId: string,
  nextSnippetId: string
): SelfHostedSnippetStoreAction {
  return previousId !== nextSnippetId ? 'replace' : 'update'
}

/**
 * Pure orchestration for self-hosted move/rename store + navigation updates.
 * Modals apply the returned plan against Valtio/tabs/router.
 */
export function getSelfHostedSnippetStoreSyncPlan({
  previousId,
  nextSnippetId,
  isViewingSnippet,
  hasOldTab,
}: {
  previousId: string
  nextSnippetId: string
  isViewingSnippet: boolean
  hasOldTab: boolean
}): SelfHostedSnippetStoreSyncPlan {
  if (getSelfHostedSnippetStoreAction(previousId, nextSnippetId) === 'replace') {
    return {
      action: 'replace',
      previousId,
      nextSnippetId,
      shouldNavigate: isViewingSnippet,
      shouldRemoveOldTab: hasOldTab,
    }
  }

  return { action: 'update', snippetId: previousId }
}
