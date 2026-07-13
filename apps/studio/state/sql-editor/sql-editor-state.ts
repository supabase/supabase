import { untrustedSql } from '@supabase/pg-meta'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { proxy, snapshot, useSnapshot } from 'valtio'
import { devtools, proxyMap } from 'valtio/utils'

import {
  folderStatusOnSaveStart,
  isNewFolder,
  statusOnDiscard,
  statusOnEdit,
} from './sql-editor-lifecycle'
import { sqlEditorSessionState } from './sql-editor-session-state'
import type { StateSnippet, StateSnippetFolder } from './types'
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
   * Snippets queued for saving. Key is the snippet id, value is whether saving
   * it should also invalidate the snippet/folder lists.
   */
  needsSaving: proxyMap<string, boolean>([]),
  /**
   * Folders queued for saving (create or rename). Kept separate from
   * `needsSaving` so snippet and folder saves are scheduled independently.
   */
  pendingFolderSaves: proxyMap<string, boolean>([]),

  get allFolderNames() {
    return Object.values(sqlEditorState.folders).map((x) => x.folder.name)
  },

  // ========================================================================
  // ## Methods to interact the store with
  // ========================================================================

  /**
   * Load snippet into SQL Editor Valtio store
   */
  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: SnippetWithContent }) => {
    if (sqlEditorState.snippets[snippet.id]) return

    sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
  },

  /**
   *
   * Clear local snippet content that is not persisted to the database. Deletes
   * user edits that have not been saved.
   */
  clearSnippetContent: (id: string) => {
    const storeSnippet = sqlEditorState.snippets[id]
    if (storeSnippet) {
      storeSnippet.snippet.content = undefined
      storeSnippet.snippet.status = statusOnDiscard(storeSnippet.snippet.status)
    }
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
      // Mark dirty immediately so `status` (not the transient needsSaving queue)
      // is the durable source of truth for unsaved changes, even before the
      // debounced save begins.
      snippet.status = statusOnEdit(snippet.status)
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

    // Results/explain live in the session store; drop this snippet's entries.
    sqlEditorSessionState.clearForSnippet(id)

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
