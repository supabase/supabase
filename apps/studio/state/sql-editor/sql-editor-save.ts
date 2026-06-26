import { debounce, memoize } from 'lodash'

import { statusOnSaveError, statusOnSaveStart, statusOnSaveSuccess } from './sql-editor-lifecycle'
import { buildUpsertPayload, isLoadedSnippet } from './sql-editor-rules'
import type { StateSnippet, StateSnippetFolder } from './types'
import type { UpsertContentPayload } from '@/data/content/content-upsert-mutation'
import type { SnippetFolder } from '@/data/content/sql-folders-query'
import { getErrorMessage } from '@/lib/get-error-message'
import type { Notifier } from '@/lib/notifier'

const GENERIC_ERROR_MESSAGE = 'an unexpected error occurred'

/**
 * The slice of the SQL editor store the save mechanism reads from and writes to.
 * Declared structurally (rather than depending on the concrete store) so the
 * mechanism can be exercised in isolation with a plain fake.
 */
export interface SaveMechanismStore {
  snippets: { [id: string]: StateSnippet | undefined }
  folders: { [id: string]: StateSnippetFolder | undefined }
  removeFolder: (id: string) => void
}

export interface SaveMechanismDeps {
  state: SaveMechanismStore
  upsertContent: (vars: { projectRef: string; payload: UpsertContentPayload }) => Promise<unknown>
  createSQLSnippetFolder: (vars: { projectRef: string; name: string }) => Promise<SnippetFolder>
  updateSQLSnippetFolder: (vars: {
    projectRef: string
    id: string
    name: string
  }) => Promise<unknown>
  /** Invalidate the snippet/folder/count lists for a project. */
  invalidate: (projectRef: string) => Promise<void>
  /** Surface success/error toasts. */
  notify: Notifier
  /** Build the upsert payload. Injectable for testing; defaults to buildUpsertPayload. */
  buildPayload?: typeof buildUpsertPayload
  /** Snippet save debounce in ms. Defaults to 1000. */
  debounceMs?: number
}

export interface SaveSnippetArgs {
  id: string
  projectRef: string
  shouldInvalidate: boolean
}

export interface CreateFolderArgs {
  projectRef: string
  name: string
  /** Id of the local placeholder folder to swap for the persisted one. */
  placeholderId: string
}

export interface UpdateFolderArgs {
  id: string
  projectRef: string
  name: string
}

/**
 * The save *mechanism*: it knows how to persist a snippet or folder and how to
 * reflect that in the store (status transitions, list invalidation, folder
 * placeholder swap / rollback). It does NOT decide *when* to save — that policy
 * lives in the store's subscribe today, and moves to a scheduler in a later PR.
 *
 * Dependencies (data-layer calls, query invalidation, notifications, the store,
 * the debounce window) are injected, and the per-snippet debounce cache lives in
 * this factory closure so each instance — and each test — starts clean.
 */
export function createSaveMechanism(deps: SaveMechanismDeps) {
  const {
    state,
    upsertContent,
    createSQLSnippetFolder,
    updateSQLSnippetFolder,
    invalidate,
    notify,
    buildPayload = buildUpsertPayload,
    debounceMs = 1000,
  } = deps

  async function saveSnippet({ id, projectRef, shouldInvalidate }: SaveSnippetArgs) {
    const snippet = state.snippets[id]?.snippet
    // Only persist a snippet whose content has been loaded — otherwise we would
    // PUT an empty content body and clobber the stored SQL.
    if (snippet === undefined || !isLoadedSnippet(snippet)) return

    const payload = buildPayload(snippet, id)
    try {
      snippet.status = statusOnSaveStart(snippet.status)
      await upsertContent({ projectRef, payload })
      if (shouldInvalidate) await invalidate(projectRef)
      snippet.status = statusOnSaveSuccess()
    } catch (error) {
      snippet.status = statusOnSaveError(snippet.status)
    }
  }

  const memoizedSaveSnippet = memoize((_id: string) => debounce(saveSnippet, debounceMs))

  /** Debounced per snippet id; rapid edits to one snippet coalesce to one save. */
  function scheduleSaveSnippet(args: SaveSnippetArgs) {
    memoizedSaveSnippet(args.id)(args)
  }

  async function createFolder({ projectRef, name, placeholderId }: CreateFolderArgs) {
    try {
      const folder = await createSQLSnippetFolder({ projectRef, name })
      notify.success('Successfully created folder')
      // Swap the local placeholder for the persisted folder.
      state.removeFolder(placeholderId)
      state.folders[folder.id] = { projectRef, status: 'idle', folder }
    } catch (error: unknown) {
      notify.error(`Failed to save folder: ${getErrorMessage(error) ?? GENERIC_ERROR_MESSAGE}`)
      // Roll back the placeholder — there is no persisted folder to keep.
      state.removeFolder(placeholderId)
    }
  }

  async function updateFolder({ id, projectRef, name }: UpdateFolderArgs) {
    const storeFolder = state.folders[id]
    if (!storeFolder) return

    try {
      await updateSQLSnippetFolder({ projectRef, id, name })
      notify.success('Successfully updated folder')
    } catch (error: unknown) {
      notify.error(`Failed to save folder: ${getErrorMessage(error) ?? GENERIC_ERROR_MESSAGE}`)
      // Roll back the optimistic rename to this folder's own previous name.
      if (storeFolder.previousName !== undefined) {
        storeFolder.folder.name = storeFolder.previousName
      }
    } finally {
      storeFolder.status = 'idle'
      storeFolder.previousName = undefined
    }
  }

  return {
    /** Schedule a debounced save of the snippet with the given id. */
    saveSnippet: scheduleSaveSnippet,
    /** Persist a new folder, swapping out its local placeholder. */
    createFolder,
    /** Persist a folder rename. */
    updateFolder,
  }
}

export type SaveMechanism = ReturnType<typeof createSaveMechanism>
