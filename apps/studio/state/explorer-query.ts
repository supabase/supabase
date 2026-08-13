import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'

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

const readPersistedDrafts = (storage: StorageLike, projectRef: string) => {
  const raw = storage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS(projectRef))
  if (!raw) return {} as PersistedExplorerQueryDrafts

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([id, value]) => {
        if (
          value === null ||
          typeof value !== 'object' ||
          !('name' in value) ||
          typeof value.name !== 'string' ||
          !('sql' in value) ||
          typeof value.sql !== 'string' ||
          !('updatedAt' in value) ||
          typeof value.updatedAt !== 'number'
        ) {
          return []
        }

        const parsedSource =
          'source' in value
            ? querySourceBindingSchema.safeParse(value.source)
            : { success: false as const }
        const source = parsedSource.success
          ? parsedSource.data
          : createDefaultSourceBinding('database')

        return [[id, { name: value.name, source, sql: value.sql, updatedAt: value.updatedAt }]]
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

      const persisted = readPersistedDrafts(storage, draft.projectRef)
      persisted[id] = {
        name: draft.name,
        source: draft.source,
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
