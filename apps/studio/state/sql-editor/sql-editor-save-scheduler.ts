import { subscribe } from 'valtio'

import { isNewFolder } from './sql-editor-lifecycle'
import { validateMoveToFolder } from './sql-editor-rules'
import type { SaveMechanism } from './sql-editor-save'
import type { StateSnippet, StateSnippetFolder } from './types'
import type { Notifier } from '@/lib/notifier'

/**
 * Whether snippet edits persist on their own ('auto') or only when the user
 * asks ('manual'). Only 'auto' is wired today; 'manual' is the seam for a future
 * opt-in. Folder creates/renames are explicit user actions and always persist.
 */
export type SaveMode = 'auto' | 'manual'

/** The slice of the store the scheduler watches and reads. */
export interface SaveSchedulerStore {
  /** Snippet ids queued for save; value is whether to invalidate the lists. */
  needsSaving: Map<string, boolean>
  /** Folder ids queued for save (create or rename). */
  pendingFolderSaves: Map<string, boolean>
  snippets: { [id: string]: StateSnippet | undefined }
  folders: { [id: string]: StateSnippetFolder | undefined }
}

export interface SaveSchedulerDeps {
  state: SaveSchedulerStore
  saveMechanism: Pick<SaveMechanism, 'saveSnippet' | 'createFolder' | 'updateFolder'>
  notify: Notifier
  /** Resolves the current save mode. Defaults to 'auto'. */
  getSaveMode?: () => SaveMode
}

/**
 * The save *scheduler*: it owns the policy of *when* the save mechanism runs.
 * In 'auto' mode it drains the dirty snippet queue as edits land; in 'manual'
 * mode it leaves snippets queued until `requestSave` is called. Folder saves are
 * always drained. This is the unit that the headless provider `start()`s; it is
 * decoupled from React so it can be exercised directly.
 */
export function createSaveScheduler({
  state,
  saveMechanism,
  notify,
  getSaveMode = () => 'auto',
}: SaveSchedulerDeps) {
  function flushSnippet(id: string, shouldInvalidate: boolean) {
    const stateSnippet = state.snippets[id]
    if (stateSnippet === undefined) return

    const { visibility, folder_id } = stateSnippet.snippet
    const moveCheck = validateMoveToFolder({ visibility, folderId: folder_id })
    if (!moveCheck.ok) {
      notify.error(moveCheck.error)
      return
    }

    saveMechanism.saveSnippet({ id, projectRef: stateSnippet.projectRef, shouldInvalidate })
  }

  function flushFolder(id: string) {
    const stateFolder = state.folders[id]
    if (stateFolder === undefined) return

    const { projectRef, folder, status } = stateFolder
    if (isNewFolder(status)) {
      saveMechanism.createFolder({ projectRef, name: folder.name, placeholderId: id })
    } else {
      saveMechanism.updateFolder({ id, projectRef, name: folder.name })
    }
  }

  function drainSnippetQueue() {
    for (const [id, shouldInvalidate] of Array.from(state.needsSaving.entries())) {
      state.needsSaving.delete(id)
      flushSnippet(id, shouldInvalidate)
    }
  }

  function drainFolderQueue() {
    for (const [id] of Array.from(state.pendingFolderSaves.entries())) {
      state.pendingFolderSaves.delete(id)
      flushFolder(id)
    }
  }

  function start() {
    const unsubscribeSnippets = subscribe(state.needsSaving, () => {
      // In manual mode, edits stay queued until an explicit requestSave.
      if (getSaveMode() !== 'auto') return
      drainSnippetQueue()
    })
    const unsubscribeFolders = subscribe(state.pendingFolderSaves, () => {
      drainFolderQueue()
    })
    return () => {
      unsubscribeSnippets()
      unsubscribeFolders()
    }
  }

  /** Explicit save (e.g. Cmd+S / retry): persist now regardless of save mode. */
  function requestSave(id: string) {
    state.needsSaving.delete(id)
    flushSnippet(id, true)
  }

  return { start, requestSave }
}

export type SaveScheduler = ReturnType<typeof createSaveScheduler>
