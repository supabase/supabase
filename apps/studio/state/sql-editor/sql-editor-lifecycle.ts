import type { SnippetStatus } from '@/data/content/snippet-status'

/**
 * True when the snippet has never been successfully written to the database.
 * Gates content fetching and list invalidation, and marks locally-created
 * snippets for the replication-lag 404 swallow in the `[id]` page.
 */
export function wasNeverPersisted(status: SnippetStatus | undefined): boolean {
  return status === 'new' || status === 'new_saving' || status === 'new_save_failed'
}

/** True while a save request is in flight (whether first save or re-save). */
export function isSaving(status: SnippetStatus | undefined): boolean {
  return status === 'new_saving' || status === 'saving'
}

/**
 * True when the most recent save attempt failed (whether first save or
 * re-save).
 */
export function isSaveFailed(status: SnippetStatus | undefined): boolean {
  return status === 'new_save_failed' || status === 'save_failed'
}

/**
 *  Transition when a save request begins, preserving the never-persisted axis.
 */
export function statusOnSaveStart(status: SnippetStatus | undefined): SnippetStatus {
  return wasNeverPersisted(status) ? 'new_saving' : 'saving'
}

/** Transition when a save succeeds — the snippet is now persisted and clean. */
export function statusOnSaveSuccess(): SnippetStatus {
  return 'saved'
}

/** Transition when a save fails, preserving the never-persisted axis. */
export function statusOnSaveError(status: SnippetStatus | undefined): SnippetStatus {
  return wasNeverPersisted(status) ? 'new_save_failed' : 'save_failed'
}
