/**
 * The lifecycle of a snippet in the SQL editor, modelled as a single set of
 * mutually-exclusive states.
 *
 * The status is attached to a snippet as it enters the app: 'saved' when
 * fetched from the database (see the snippet queries in this directory) and
 * 'new' when created locally (see createSqlSnippetSkeletonV2). The transition
 * and predicate helpers live in state/sql-editor/sql-editor-lifecycle.
 */
export type SnippetStatus =
  // Never persisted to the database (created locally this session):
  | 'new' // idle, never saved
  | 'new_saving' // first save in flight
  | 'new_save_failed' // first save failed
  // Persisted to the database at least once:
  | 'saved' // no pending changes
  | 'unsaved' // has pending local edits
  | 'saving' // re-save in flight
  | 'save_failed' // last save failed
