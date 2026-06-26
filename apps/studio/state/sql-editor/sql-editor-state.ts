import { untrustedSql } from '@supabase/pg-meta'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'
import { devtools, proxyMap } from 'valtio/utils'

import { folderStatusOnSaveStart, isNewFolder } from './sql-editor-lifecycle'
import type { StateSnippet, StateSnippetFolder } from './types'
import type { QueryPlanRow } from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import { DiffType } from '@/components/interfaces/SQLEditor/SQLEditor.types'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'
import { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'

export const sqlEditorState = proxy({
  // ========================================================================
  // ## Data properties within the store
  // ========================================================================

  /**
   * Currently limitations include supporting up to one level of folders from root, and only private snippets
   */
  folders: {} as {
    [folderId: string]: StateSnippetFolder
  },

  /**
   * Private and shared snippets only, favorite snippets are derivatives of them by the `favorite` property
   */
  snippets: {} as {
    [snippetId: string]: StateSnippet
  },

  /**
   * Query results, if any, for a snippet. Set as an array per snippetId as we were previously experimenting
   * with having a Jupyter notebook like UI but it never took off. Nonetheless kept this data structure as
   * we'd also want to support returning multiple results from a single query (e.g From a query that contains
   * multiple select statements), and this will allow us to do quite easily.
   */
  results: {} as {
    [snippetId: string]: {
      rows: any[]
      error?: any
      autoLimit?: number
    }[]
  },

  /**
   * Explain results, if any, for a snippet
   */
  explainResults: {} as {
    [snippetId: string]: {
      rows: QueryPlanRow[]
      error?: { message: string; formattedError?: string }
    }
  },
  /**
   * Snippets queued for saving. Key is the snippet id, value is whether saving
   * it should also invalidate the snippet/folder lists.
   */
  needsSaving: proxyMap<string, boolean>([]),
  /**
   * Folders queued for saving (create or rename). Kept separate from
   * `needsSaving` so snippet and folder saves are scheduled independently.
   */
  pendingFolderSaves: proxyMap<string, boolean>([]),
  /**
   * UI-imposed limit for the number of results a query can return (applied to the SQL query being run if applicable).
   * Acts as a safeguard to prevent accidentally taking down the database from a really large SELECT query.
   * Related to `autoLimit` in `results`. Refer to `checkIfAppendLimitRequired` and `suffixWithLimit` for usage.
   */
  limit: 100,

  /**
   * For Assistant to render diffing into the editor
   */
  diffContent: undefined as undefined | { sql: string; diffType: DiffType },

  get allFolderNames() {
    return Object.values(sqlEditorState.folders).map((x) => x.folder.name)
  },

  // ========================================================================
  // ## Methods to interact the store with
  // ========================================================================

  setDiffContent: (sql: string, diffType: DiffType) =>
    (sqlEditorState.diffContent = { sql, diffType }),

  /**
   * Load snippet into SQL Editor Valtio store
   */
  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: SnippetWithContent }) => {
    if (sqlEditorState.snippets[snippet.id]) return

    sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
    sqlEditorState.results[snippet.id] = []
    sqlEditorState.explainResults[snippet.id] = { rows: [] }
  },

  /**
   * Update snippet data (e.g name, visibility, chart) and queue for sync saving
   */
  updateSnippet: ({
    id,
    snippet,
    skipSave = false,
  }: {
    id: string
    snippet: Partial<Snippet>
    skipSave?: boolean
  }) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet = {
        ...sqlEditorState.snippets[id].snippet,
        ...snippet,
      }
      if (!skipSave) sqlEditorState.needsSaving.set(id, true)
    }
  },

  /**
   * Load snippet content into the snippet within the Valtio store.
   * Snippets fetched from the GET /content or /folders endpoints do not have the content loaded initially
   * to reduce the response size from the API. Hence content for each snippet has to be loaded on demand
   */
  setSnippet: (projectRef: string, snippet: SnippetWithContent) => {
    let storedSnippet = sqlEditorState.snippets[snippet.id]
    if (storedSnippet) {
      if (!storedSnippet.snippet.content) {
        storedSnippet.snippet.content = snippet.content
      }
    } else {
      sqlEditorState.addSnippet({ projectRef: projectRef, snippet })
    }
  },

  /**
   * Update the snippet content of a snippet and queue for sync saving
   * Possibly can consolidate with `updateSnippet` to simplify
   */
  setSql: ({
    id,
    sql,
    shouldInvalidate = false,
  }: {
    id: string
    sql: string
    shouldInvalidate?: boolean
  }) => {
    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet?.content) {
      snippet.content.unchecked_sql = untrustedSql(sql)
      sqlEditorState.needsSaving.set(id, shouldInvalidate)
    }
  },

  /**
   * Update snippet in Valtio store after renaming
   * Renaming a snippet follows an async saving and hence doesnt require queuing for sync saving here
   * Refer to `RenameQueryModal.tsx` for more details
   */
  renameSnippet: ({
    id,
    name,
    description,
  }: {
    id: string
    name: string
    description?: string
  }) => {
    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet) {
      snippet.name = name
      snippet.description = description
    }
  },

  /**
   * Remove snippet from the Valtio store, and optionally remove snippet from the sync saving queue
   */
  removeSnippet: (id: string, skipSave: boolean = false) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    const { [id]: explainResult, ...otherExplainResults } = sqlEditorState.explainResults
    sqlEditorState.explainResults = otherExplainResults

    if (!skipSave) sqlEditorState.needsSaving.delete(id)
  },

  /**
   * Load folder into SQL Editor Valtio store
   */
  addFolder: ({ projectRef, folder }: { projectRef: string; folder: SnippetFolder }) => {
    if (sqlEditorState.folders[folder.id]) return
    sqlEditorState.folders[folder.id] = { projectRef, status: 'idle', folder }
  },

  /**
   * Adds a new folder placeholder for the UI to render. The placeholder gets a
   * unique local id and `status: 'new_editing'` to mark it as not-yet-persisted
   * (the status, not the id, is what tags it as new).
   */
  addNewFolder: ({ projectRef }: { projectRef: string }) => {
    const id = crypto.randomUUID()
    sqlEditorState.folders[id] = {
      projectRef,
      status: 'new_editing',
      folder: {
        id,
        name: '',
        owner_id: -1,
        project_id: -1,
        parent_id: null,
      },
    }
  },

  editFolder: (id: string) => {
    const storeFolder = sqlEditorState.folders[id]
    if (storeFolder) {
      storeFolder.status = isNewFolder(storeFolder.status) ? 'new_editing' : 'editing'
    }
  },

  /**
   * For renaming a folder, queue for sync saving if pass all validations
   */
  saveFolder: ({ id, name }: { id: string; name: string }) => {
    let storeFolder = sqlEditorState.folders[id]
    const isNew = isNewFolder(storeFolder.status)
    const hasChanges = storeFolder.folder.name !== name
    const folderNameTaken = sqlEditorState.allFolderNames.includes(name)

    if (isNew && folderNameTaken) {
      sqlEditorState.removeFolder(id)
      return toast.error('Unable to create new folder: This folder name already exists')
    } else if (hasChanges && folderNameTaken) {
      storeFolder.status = 'idle'
      return toast.error('Unable to update folder: This folder name already exists')
    }

    const originalFolderName = storeFolder.folder.name.slice()

    storeFolder.status = hasChanges ? folderStatusOnSaveStart(storeFolder.status) : 'idle'
    storeFolder.folder.id = id
    storeFolder.folder.name = name

    if (hasChanges) {
      // Remember this folder's own pre-rename name so a failed save can roll back.
      storeFolder.previousName = originalFolderName
      sqlEditorState.pendingFolderSaves.set(id, true)
    }
  },

  /**
   * Remove folder from the Valtio store
   * Deleting a folder follows an async saving and hence doesnt require queuing for sync saving here
   * Refer to `SQLEditorNav` for more details (ConfirmationModal for deleting a folder)
   */
  removeFolder: (id: string) => {
    const { [id]: folder, ...otherFolders } = sqlEditorState.folders
    sqlEditorState.folders = otherFolders
  },

  /**
   * Set the value for the auto limit for SELECT based SQL queries
   */
  setLimit: (value: number) => (sqlEditorState.limit = value),

  addNeedsSaving: (id: string) => sqlEditorState.needsSaving.set(id, true),

  addFavorite: (id: string) => {
    const storeSnippet = sqlEditorState.snippets[id]
    if (storeSnippet) {
      storeSnippet.snippet.favorite = true
      sqlEditorState.needsSaving.set(id, true)
    }
  },

  removeFavorite: (id: string) => {
    const storeSnippet = sqlEditorState.snippets[id]
    if (storeSnippet.snippet) {
      storeSnippet.snippet.favorite = false
      sqlEditorState.needsSaving.set(id, true)
    }
  },

  addResult: (id: string, results: any[], autoLimit?: number) => {
    if (sqlEditorState.results[id]) {
      // Use ref() to prevent Valtio from creating proxies for each row object.
      // This is critical for large result sets - without ref(), Valtio wraps every
      // row and nested property in a Proxy, causing massive memory overhead.
      // Alright to use ref() in this case as the data is meant to be read-only and we
      // don't need to track changes to the underlying data
      sqlEditorState.results[id] = [{ rows: ref(results), autoLimit }]
    }
  },

  addResultError: (id: string, error: any, autoLimit?: number) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id] = [{ rows: ref([]), error, autoLimit }]
    }
  },

  resetResult: (id: string) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id] = []
    }
  },

  addExplainResult: (id: string, results: QueryPlanRow[]) => {
    // Use ref() to prevent Valtio from creating proxies for each row object
    sqlEditorState.explainResults[id] = { rows: ref(results) }
  },

  addExplainResultError: (id: string, error: { message: string; formattedError?: string }) => {
    sqlEditorState.explainResults[id] = { rows: ref([]), error }
  },

  resetExplainResult: (id: string) => {
    sqlEditorState.explainResults[id] = { rows: [] }
  },

  resetResults: (id: string) => {
    sqlEditorState.resetResult(id)
    sqlEditorState.resetExplainResult(id)
  },
})

// ========================================================================
// ## Expose entry points into this Valtio store
// ========================================================================

export const getSqlEditorV2StateSnapshot = () => snapshot(sqlEditorState)

export const useSqlEditorV2StateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorState, options)

export const useSnippetFolders = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return useMemo(
    () =>
      Object.values(snapshot.folders)
        .filter((x) => x.projectRef === projectRef)
        .map((x) => x.folder)
        // folders don't have created_at or inserted_at, so we always sort by name
        .sort((a, b) => a.name.localeCompare(b.name)),
    [projectRef, snapshot.folders]
  )
}

/**
 * Get ALL snippets for a project
 */
export const useSnippets = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return useMemo(
    () =>
      Object.values(snapshot.snippets)
        .filter((storeSnippet) => storeSnippet.projectRef === projectRef)
        .map((storeSnippet) => storeSnippet.snippet),
    [projectRef, snapshot.snippets]
  )
}

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, {
    name: 'sqlEditorStateV2',
    // [Joshen] So that jest unit tests can ignore this
    enabled: process.env.NEXT_PUBLIC_ENVIRONMENT !== undefined,
  })
}
