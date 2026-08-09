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
 * True when the snippet holds changes that are not safely persisted: never
 * saved ('new' family), a save in flight, a failed save, or pending local edits
 * ('unsaved'). Used to warn before the tab is closed. Only 'saved' is clean.
 */
export function hasUnsavedChanges(status: SnippetStatus | undefined): boolean {
  return status !== undefined && status !== 'saved'
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

/**
 * Transition when the snippet is edited locally. A persisted-and-clean snippet
 * becomes 'unsaved' so its dirty state is durable immediately (rather than only
 * once the debounced save begins). Every other status is already dirty or
 * in-flight — the never-persisted family, a save in progress, or a failed
 * save — and is left unchanged so the persistence and progress axes are
 * preserved.
 */
export function statusOnEdit(status: SnippetStatus): SnippetStatus {
  return status === 'saved' ? 'unsaved' : status
}

/** Transition when a snippet is discarded — the snippet is now either never persisted or clean. */
export function statusOnDiscard(status: SnippetStatus): SnippetStatus {
  return wasNeverPersisted(status) ? 'new' : 'saved'
}

/**
 * The lifecycle of a folder in the SQL editor nav, as a single set of
 * mutually-exclusive states. Like SnippetStatus, this collapses two orthogonal
 * axes — persistence (a locally-created placeholder vs a persisted folder) and
 * progress (inline-name editing / save in flight / settled) — into one enum, so
 * a folder can never be in a nonsensical combination (e.g. "new" yet "idle").
 * The predicates below recover each axis.
 */
export type FolderStatus =
  // Never persisted to the database (a locally-created placeholder):
  | 'new_editing' // its name is being entered inline
  | 'new_saving' // its create is in flight
  // Persisted to the database:
  | 'idle' // settled
  | 'editing' // its name is being edited inline (rename)
  | 'saving' // its rename is in flight

/** True for a locally-created placeholder folder that has not been persisted. */
export function isNewFolder(status: FolderStatus | undefined): boolean {
  return status === 'new_editing' || status === 'new_saving'
}

/** True while the folder's name is being edited inline. */
export function isFolderEditing(status: FolderStatus | undefined): boolean {
  return status === 'new_editing' || status === 'editing'
}

/** True while a folder create/rename is in flight. */
export function isFolderSaving(status: FolderStatus | undefined): boolean {
  return status === 'new_saving' || status === 'saving'
}

/** Transition when a folder save begins, preserving the never-persisted axis. */
export function folderStatusOnSaveStart(status: FolderStatus): FolderStatus {
  return isNewFolder(status) ? 'new_saving' : 'saving'
}
