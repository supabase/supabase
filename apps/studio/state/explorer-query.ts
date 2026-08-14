import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'
import { z } from 'zod'

import { type QueryResult } from '@/components/interfaces/Explorer/types'
import {
  createDefaultSourceBinding,
  querySourceBindingSchema,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'

export type ExplorerQueryDraft = {
  id: string
  projectRef: string
  name: string
  source: QuerySourceBinding
  uncheckedSql: UntrustedSqlFragment
  updatedAt: number
}

export type ExplorerQueryResult = QueryResult & {
  executedAt: number
}

type PersistedExplorerQueryDraft = {
  name: string
  source: QuerySourceBinding
  sql: string
  updatedAt: number
}

type PersistedExplorerQueryDrafts = Record<string, PersistedExplorerQueryDraft>

type StorageLike = Pick<typeof safeLocalStorage, 'getItem' | 'setItem' | 'removeItem'>

export const EXPLORER_QUERY_PERSIST_DELAY = 300
export const MAX_PERSISTED_EXPLORER_QUERY_DRAFTS = 50

const persistedDraftsSchema = z.record(z.string(), z.unknown())
const persistedDraftSchema = z.object({
  name: z.string(),
  sql: z.string(),
  updatedAt: z.number(),
  source: z.unknown().optional(),
})

const readPersistedDrafts = (storage: StorageLike, projectRef: string) => {
  const raw = storage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS(projectRef))
  if (!raw) return {} as PersistedExplorerQueryDrafts

  try {
    const parsed = persistedDraftsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return {}

    return Object.fromEntries(
      Object.entries(parsed.data).flatMap(([id, value]) => {
        const draft = persistedDraftSchema.safeParse(value)
        if (!draft.success) return []

        const parsedSource = querySourceBindingSchema.safeParse(draft.data.source)
        const source = parsedSource.success
          ? parsedSource.data
          : createDefaultSourceBinding('database')

        return [
          [
            id,
            {
              name: draft.data.name,
              source,
              sql: draft.data.sql,
              updatedAt: draft.data.updatedAt,
            },
          ],
        ]
      })
    )
  } catch {
    return {} as PersistedExplorerQueryDrafts
  }
}

const writePersistedDrafts = (
  storage: StorageLike,
  projectRef: string,
  drafts: PersistedExplorerQueryDrafts
) => {
  const key = LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS(projectRef)
  const retainedDrafts = Object.fromEntries(
    Object.entries(drafts)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_PERSISTED_EXPLORER_QUERY_DRAFTS)
  )

  if (Object.keys(retainedDrafts).length === 0) storage.removeItem(key)
  else storage.setItem(key, JSON.stringify(retainedDrafts))
}

export const createExplorerQueryState = (storage: StorageLike = safeLocalStorage) => {
  const pendingPersistence = new Map<
    string,
    { timeout: ReturnType<typeof setTimeout>; persist: () => void }
  >()

  const state = proxy({
    drafts: {} as Record<string, ExplorerQueryDraft>,
    results: {} as Record<string, ExplorerQueryResult>,

    createDraft: ({
      id,
      projectRef,
      name = 'Untitled query',
      sql = '',
      source = createDefaultSourceBinding('database'),
    }: {
      id: string
      projectRef: string
      name?: string
      sql?: string
      source?: QuerySourceBinding
    }) => {
      const draft: ExplorerQueryDraft = {
        id,
        projectRef,
        name,
        source: querySourceBindingSchema.parse(source),
        uncheckedSql: untrustedSql(sql),
        updatedAt: Date.now(),
      }
      state.drafts[id] = draft

      const persisted = readPersistedDrafts(storage, projectRef)
      persisted[id] = { name, source: draft.source, sql, updatedAt: draft.updatedAt }
      writePersistedDrafts(storage, projectRef, persisted)

      return id
    },

    restoreDraft: ({ id, projectRef }: { id: string; projectRef: string }) => {
      if (state.drafts[id]?.projectRef === projectRef) return true

      const persisted = readPersistedDrafts(storage, projectRef)[id]
      if (!persisted) return false

      state.drafts[id] = {
        id,
        projectRef,
        name: persisted.name,
        source: persisted.source,
        uncheckedSql: untrustedSql(persisted.sql),
        updatedAt: persisted.updatedAt,
      }
      return true
    },

    updateDraft: ({
      id,
      name,
      source,
      sql,
    }: {
      id: string
      name?: string
      source?: QuerySourceBinding
      sql?: string
    }) => {
      const draft = state.drafts[id]
      if (!draft) return

      if (name !== undefined) draft.name = name
      if (source !== undefined) {
        draft.source = querySourceBindingSchema.parse(source)
        delete state.results[id]
      }
      if (sql !== undefined) draft.uncheckedSql = untrustedSql(sql)
      draft.updatedAt = Date.now()

      const persist = () => {
        const pending = pendingPersistence.get(id)
        if (pending) clearTimeout(pending.timeout)
        pendingPersistence.delete(id)
        const currentDraft = state.drafts[id]
        if (!currentDraft) return

        const persisted = readPersistedDrafts(storage, currentDraft.projectRef)
        persisted[id] = {
          name: currentDraft.name,
          source: currentDraft.source,
          sql: currentDraft.uncheckedSql,
          updatedAt: currentDraft.updatedAt,
        }
        writePersistedDrafts(storage, currentDraft.projectRef, persisted)
      }

      const pending = pendingPersistence.get(id)
      if (pending) clearTimeout(pending.timeout)

      if (name !== undefined || source !== undefined) persist()
      else {
        const timeout = setTimeout(persist, EXPLORER_QUERY_PERSIST_DELAY)
        pendingPersistence.set(id, { timeout, persist })
      }
    },

    flushPendingPersistence: ({ projectRef }: { projectRef?: string } = {}) => {
      for (const [id, pending] of [...pendingPersistence]) {
        if (projectRef !== undefined && state.drafts[id]?.projectRef !== projectRef) continue
        pending.persist()
      }
    },

    removeDraft: ({ id, projectRef }: { id: string; projectRef: string }) => {
      const pending = pendingPersistence.get(id)
      if (pending) clearTimeout(pending.timeout)
      pendingPersistence.delete(id)

      if (state.drafts[id]?.projectRef === projectRef) {
        delete state.drafts[id]
        delete state.results[id]
      }

      const persisted = readPersistedDrafts(storage, projectRef)
      delete persisted[id]
      writePersistedDrafts(storage, projectRef, persisted)
    },

    setResult: ({ id, result }: { id: string; result: ExplorerQueryResult }) => {
      state.results[id] = ref(result)
    },
  })

  return state
}

export const explorerQueryState = createExplorerQueryState()

export const getExplorerQueryStateSnapshot = () => snapshot(explorerQueryState)

export const useExplorerQueryStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(explorerQueryState, options)
