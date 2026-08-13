import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'
import { z } from 'zod'

import { type QueryResult } from '@/components/interfaces/Explorer/types'
import {
  type DatabaseSourceParameters,
  type LogsSourceParameters,
} from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql, type UntrustedLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import {
  createDefaultSourceBinding,
  querySourceBindingSchema,
  toQuerySourceBinding,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'

type ExplorerQueryDraftBase = {
  id: string
  projectRef: string
  name: string
  updatedAt: number
}

/**
 * A standalone Explorer query draft. Tagged by backend rather than carrying a separate
 * `source` object, mirroring how notebook cells store their binding: the tag narrows
 * `uncheckedSql` to that backend's brand, so a Postgres draft's text can never be handed
 * to the analytics wire boundary (or vice versa) without failing to compile.
 */
export type DatabaseQueryDraft = ExplorerQueryDraftBase &
  DatabaseSourceParameters & {
    _tag: 'database'
    uncheckedSql: UntrustedSqlFragment
  }

export type LogsQueryDraft = ExplorerQueryDraftBase &
  LogsSourceParameters & {
    _tag: 'logs'
    uncheckedSql: UntrustedLogSqlFragment
  }

export type ExplorerQueryDraft = DatabaseQueryDraft | LogsQueryDraft

export type ExplorerQueryResult = QueryResult & {
  executedAt: number
}

/**
 * Drafts persist their binding under a single `source` key. This is browser-local storage,
 * not the notebook wire contract, so nesting costs nothing here and lets the whole binding
 * be validated in one `safeParse`.
 */
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

/**
 * Rebuilds a draft from its persisted form, branding the SQL for the backend the binding
 * names. The single place a stored string re-enters the type system as untrusted SQL, which
 * is what keeps the brand correlated with the backend rather than assumed.
 */
const toDraft = ({
  id,
  projectRef,
  persisted,
}: {
  id: string
  projectRef: string
  persisted: PersistedExplorerQueryDraft
}): ExplorerQueryDraft => {
  const base = { id, projectRef, name: persisted.name, updatedAt: persisted.updatedAt }

  if (persisted.source._tag === 'logs') {
    return {
      ...base,
      _tag: 'logs',
      time_range: persisted.source.time_range,
      uncheckedSql: untrustedLogSql(persisted.sql),
    }
  }

  return {
    ...base,
    _tag: 'database',
    database_identifier: persisted.source.database_identifier,
    uncheckedSql: untrustedSql(persisted.sql),
  }
}

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

  const persistDraft = (draft: ExplorerQueryDraft) => {
    const persisted = readPersistedDrafts(storage, draft.projectRef)
    persisted[draft.id] = {
      name: draft.name,
      source: toQuerySourceBinding(draft),
      sql: draft.uncheckedSql,
      updatedAt: draft.updatedAt,
    }
    writePersistedDrafts(storage, draft.projectRef, persisted)
  }

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
      const draft = toDraft({
        id,
        projectRef,
        persisted: {
          name,
          source: querySourceBindingSchema.parse(source),
          sql,
          updatedAt: Date.now(),
        },
      })

      state.drafts[id] = draft
      persistDraft(draft)

      return id
    },

    restoreDraft: ({ id, projectRef }: { id: string; projectRef: string }) => {
      if (state.drafts[id]?.projectRef === projectRef) return true

      const persisted = readPersistedDrafts(storage, projectRef)[id]
      if (!persisted) return false

      state.drafts[id] = toDraft({ id, projectRef, persisted })
      return true
    },

    /**
     * Applies an edit to a draft. The draft is rebuilt rather than mutated in place, since
     * a backend change changes which brand its SQL carries; a stale result from the old
     * backend is dropped, because another engine returns unrelated columns.
     *
     * NOTE — see `changeCellSource`: keeping the query text across a backend change is very
     * likely not what the user wants, since the dialects differ, and is kept for now only
     * because it destroys nothing. Worth revisiting alongside the notebook-cell behavior.
     *
     * A rename or a source change is a discrete action, so it writes through immediately;
     * SQL keystrokes are debounced by `EXPLORER_QUERY_PERSIST_DELAY`.
     */
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

      const nextSource = source === undefined ? undefined : querySourceBindingSchema.parse(source)
      if (nextSource !== undefined && nextSource._tag !== draft._tag) delete state.results[id]

      state.drafts[id] = toDraft({
        id,
        projectRef: draft.projectRef,
        persisted: {
          name: name ?? draft.name,
          source: nextSource ?? toQuerySourceBinding(draft),
          sql: sql ?? draft.uncheckedSql,
          updatedAt: Date.now(),
        },
      })

      const persist = () => {
        const pending = pendingPersistence.get(id)
        if (pending) clearTimeout(pending.timeout)
        pendingPersistence.delete(id)

        const currentDraft = state.drafts[id]
        if (!currentDraft) return
        persistDraft(currentDraft)
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
