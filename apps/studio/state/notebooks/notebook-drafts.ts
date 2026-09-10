import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { z } from 'zod'

import {
  notebookDomainSchema,
  notebookSchema,
  toWireNotebook,
  type NotebookContent,
  type NotebookWire,
} from '@/data/content/notebooks/notebook-schema'

/**
 * A notebook's unsaved cell content, persisted locally so it survives a browser refresh.
 * `baseUpdatedAt` snapshots the server's `updated_at` this draft branched from (or `null`
 * for a notebook that's never been saved) — compared against the server's current value
 * on restore to tell "nothing else changed" apart from "the server moved on since", e.g.
 * an assistant edit landed while this draft was pending.
 */
export type PersistedNotebookDraft = {
  name: string
  content: NotebookWire
  baseUpdatedAt: string | null
  updatedAt: number
}

type PersistedNotebookDrafts = Record<string, PersistedNotebookDraft>

type StorageLike = Pick<typeof safeLocalStorage, 'getItem' | 'setItem' | 'removeItem'>

export const MAX_PERSISTED_NOTEBOOK_DRAFTS = 50

const persistedDraftsSchema = z.record(z.string(), z.unknown())
const persistedDraftSchema = z.object({
  name: z.string(),
  content: notebookSchema,
  baseUpdatedAt: z.string().nullable(),
  updatedAt: z.number(),
})

function readPersistedDrafts(storage: StorageLike, projectRef: string): PersistedNotebookDrafts {
  const raw = storage.getItem(LOCAL_STORAGE_KEYS.NOTEBOOK_DRAFTS(projectRef))
  if (!raw) return {}

  try {
    const parsed = persistedDraftsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return {}

    return Object.fromEntries(
      Object.entries(parsed.data).flatMap(([id, value]) => {
        const draft = persistedDraftSchema.safeParse(value)
        return draft.success ? [[id, draft.data]] : []
      })
    )
  } catch {
    return {}
  }
}

function writePersistedDrafts(
  storage: StorageLike,
  projectRef: string,
  drafts: PersistedNotebookDrafts
) {
  const key = LOCAL_STORAGE_KEYS.NOTEBOOK_DRAFTS(projectRef)
  const retainedDrafts = Object.fromEntries(
    Object.entries(drafts)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_PERSISTED_NOTEBOOK_DRAFTS)
  )

  if (Object.keys(retainedDrafts).length === 0) storage.removeItem(key)
  else storage.setItem(key, JSON.stringify(retainedDrafts))
}

/**
 * Writes (or overwrites) a notebook's local draft. Every cell-level edit already goes
 * through a single choke point (`notebooksState.updateCells`), so this is called there
 * directly rather than debounced — unlike ad-hoc query drafts, there's no raw keystroke
 * stream reaching this layer (cell editors only commit on blur/run).
 */
export function persistNotebookDraft({
  storage = safeLocalStorage,
  projectRef,
  id,
  name,
  content,
  baseUpdatedAt,
}: {
  storage?: StorageLike
  projectRef: string
  id: string
  name: string
  content: NotebookContent
  baseUpdatedAt: string | null
}) {
  const drafts = readPersistedDrafts(storage, projectRef)
  drafts[id] = { name, content: toWireNotebook(content), baseUpdatedAt, updatedAt: Date.now() }
  writePersistedDrafts(storage, projectRef, drafts)
}

/**
 * Reads back a notebook's local draft, re-branding its SQL through the same wire→domain
 * parse a server response goes through (`notebookDomainSchema`).
 */
export function readNotebookDraft({
  storage = safeLocalStorage,
  projectRef,
  id,
}: {
  storage?: StorageLike
  projectRef: string
  id: string
}): { name: string; content: NotebookContent; baseUpdatedAt: string | null } | undefined {
  const persisted = readPersistedDrafts(storage, projectRef)[id]
  if (!persisted) return undefined

  const content = notebookDomainSchema.safeParse(persisted.content)
  if (!content.success) return undefined

  return { name: persisted.name, content: content.data, baseUpdatedAt: persisted.baseUpdatedAt }
}

/**
 * Whether a draft exists for a notebook that isn't currently loaded into `notebooksState`
 * (e.g. a background tab from a previous session, never opened this one) — used as a
 * close-confirmation backstop, since `hasDiscardableChanges` can only see loaded notebooks.
 */
export function hasNotebookDraft({
  storage = safeLocalStorage,
  projectRef,
  id,
}: {
  storage?: StorageLike
  projectRef: string
  id: string
}): boolean {
  return readPersistedDrafts(storage, projectRef)[id] !== undefined
}

export function removeNotebookDraft({
  storage = safeLocalStorage,
  projectRef,
  id,
}: {
  storage?: StorageLike
  projectRef: string
  id: string
}) {
  const drafts = readPersistedDrafts(storage, projectRef)
  delete drafts[id]
  writePersistedDrafts(storage, projectRef, drafts)
}
