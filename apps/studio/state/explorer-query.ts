import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'

import { type QueryResult } from '@/components/interfaces/Explorer/types'

export type ExplorerQueryDraft = {
  id: string
  projectRef: string
  name: string
  uncheckedSql: UntrustedSqlFragment
  updatedAt: number
}

export type ExplorerQueryResult = QueryResult & {
  executedAt: number
}

type PersistedExplorerQueryDraft = {
  name: string
  sql: string
  updatedAt: number
}

type PersistedExplorerQueryDrafts = Record<string, PersistedExplorerQueryDraft>

type StorageLike = Pick<typeof safeLocalStorage, 'getItem' | 'setItem' | 'removeItem'>

const readPersistedDrafts = (storage: StorageLike, projectRef: string) => {
  const raw = storage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS(projectRef))
  if (!raw) return {} as PersistedExplorerQueryDrafts

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, PersistedExplorerQueryDraft] => {
        const draft = entry[1]
        return (
          draft !== null &&
          typeof draft === 'object' &&
          'name' in draft &&
          typeof draft.name === 'string' &&
          'sql' in draft &&
          typeof draft.sql === 'string' &&
          'updatedAt' in draft &&
          typeof draft.updatedAt === 'number'
        )
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
  if (Object.keys(drafts).length === 0) storage.removeItem(key)
  else storage.setItem(key, JSON.stringify(drafts))
}

export const createExplorerQueryState = (storage: StorageLike = safeLocalStorage) => {
  const state = proxy({
    drafts: {} as Record<string, ExplorerQueryDraft>,
    results: {} as Record<string, ExplorerQueryResult>,

    createDraft: ({
      id,
      projectRef,
      name = 'Untitled query',
      sql = '',
    }: {
      id: string
      projectRef: string
      name?: string
      sql?: string
    }) => {
      const draft: ExplorerQueryDraft = {
        id,
        projectRef,
        name,
        uncheckedSql: untrustedSql(sql),
        updatedAt: Date.now(),
      }
      state.drafts[id] = draft

      const persisted = readPersistedDrafts(storage, projectRef)
      persisted[id] = { name, sql, updatedAt: draft.updatedAt }
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
        uncheckedSql: untrustedSql(persisted.sql),
        updatedAt: persisted.updatedAt,
      }
      return true
    },

    updateDraft: ({ id, name, sql }: { id: string; name?: string; sql?: string }) => {
      const draft = state.drafts[id]
      if (!draft) return

      if (name !== undefined) draft.name = name
      if (sql !== undefined) draft.uncheckedSql = untrustedSql(sql)
      draft.updatedAt = Date.now()

      const persisted = readPersistedDrafts(storage, draft.projectRef)
      persisted[id] = {
        name: draft.name,
        sql: draft.uncheckedSql,
        updatedAt: draft.updatedAt,
      }
      writePersistedDrafts(storage, draft.projectRef, persisted)
    },

    removeDraft: ({ id, projectRef }: { id: string; projectRef: string }) => {
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
