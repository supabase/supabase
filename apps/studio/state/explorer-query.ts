import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'
import { z } from 'zod'

import {
  buildEntitySelectSql,
  queryEntityBindingSchema,
  type QueryEntityBinding,
} from '@/components/interfaces/Explorer/entityQuery.utils'
import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { type QueryDisplay, type QueryResult } from '@/components/interfaces/Explorer/types'
import { ROWS_PER_PAGE_OPTIONS } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import {
  chartConfigSchema,
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
import { impersonationRoleSchema, type ImpersonationRole } from '@/lib/role-impersonation'

type ExplorerQueryDraftBase = {
  id: string
  projectRef: string
  name: string
  updatedAt: number
  view: QueryDisplay['view']
  chart?: QueryDisplay['chart']
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
    rowLimit: number
    role?: ImpersonationRole
    entity?: QueryEntityBinding
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
  rowLimit?: number
  role?: ImpersonationRole
  entity?: QueryEntityBinding
} & QueryDisplay

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
  rowLimit: z.unknown().optional(),
  role: z.unknown().optional(),
  entity: z.unknown().optional(),
  view: z.unknown().optional(),
  chart: z.unknown().optional(),
})

const VALID_ROW_LIMITS = ROWS_PER_PAGE_OPTIONS.map((option) => option.value)
const queryViewSchema = z.enum(['table', 'chart'])

/**
 * Falls back to the default whenever a persisted row limit isn't one of the values the row
 * limit menu can actually produce — e.g. a fractional or out-of-range number from corrupted
 * or hand-edited storage. `undefined` (never persisted) passes through unchanged; `toDraft`
 * applies the default for that case.
 */
const rowLimitSchema = z
  .number()
  .refine((value) => VALID_ROW_LIMITS.includes(value))
  .catch(DEFAULT_CELL_ROW_LIMIT)
  .optional()

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
  const base = {
    id,
    projectRef,
    name: persisted.name,
    updatedAt: persisted.updatedAt,
    view: persisted.view,
    chart: persisted.chart,
  }

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
    rowLimit: persisted.rowLimit ?? DEFAULT_CELL_ROW_LIMIT,
    role: persisted.role,
    entity: persisted.entity,
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

        const parsedRole = impersonationRoleSchema.safeParse(draft.data.role)
        const role = parsedRole.success ? parsedRole.data : undefined
        const rowLimit = rowLimitSchema.parse(draft.data.rowLimit)
        const parsedView = queryViewSchema.safeParse(draft.data.view)
        const view = parsedView.success ? parsedView.data : 'table'
        const parsedChart = chartConfigSchema.safeParse(draft.data.chart)
        const chart = parsedChart.success ? parsedChart.data : undefined
        const parsedEntity = queryEntityBindingSchema.safeParse(draft.data.entity)
        const entity = parsedEntity.success ? parsedEntity.data : undefined

        return [
          [
            id,
            {
              name: draft.data.name,
              source,
              sql: draft.data.sql,
              updatedAt: draft.data.updatedAt,
              role,
              rowLimit,
              view,
              chart,
              entity,
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

/**
 * Whether closing a draft would actually lose something. An entity-backed draft still sitting
 * on its generated `select *` is reproducible — reopening the table rebuilds it — so only a
 * draft the user has since edited (or an ad-hoc query with any content at all) is worth a
 * discard prompt.
 */
export const hasDiscardableContent = (draft: ExplorerQueryDraft) => {
  const sql = draft.uncheckedSql.trim()
  if (sql.length === 0) return false

  const entity = draft._tag === 'database' ? draft.entity : undefined
  if (!entity) return true

  return sql !== buildEntitySelectSql(entity).trim()
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
      rowLimit: draft._tag === 'database' ? draft.rowLimit : undefined,
      role: draft._tag === 'database' ? draft.role : undefined,
      entity: draft._tag === 'database' ? draft.entity : undefined,
      view: draft.view,
      chart: draft.chart,
    }
    writePersistedDrafts(storage, draft.projectRef, persisted)
  }

  const state = proxy({
    drafts: {} as Record<string, ExplorerQueryDraft>,
    results: {} as Record<string, ExplorerQueryResult>,

    createDraft: ({
      id,
      projectRef,
      name = 'Run SQL',
      sql = '',
      source = createDefaultSourceBinding('database'),
      rowLimit = DEFAULT_CELL_ROW_LIMIT,
      entity,
    }: {
      id: string
      projectRef: string
      name?: string
      sql?: string
      source?: QuerySourceBinding
      rowLimit?: number
      entity?: QueryEntityBinding
    }) => {
      const draft = toDraft({
        id,
        projectRef,
        persisted: {
          name,
          source: querySourceBindingSchema.parse(source),
          sql,
          updatedAt: Date.now(),
          rowLimit,
          entity,
          view: 'table',
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
      rowLimit,
    }: {
      id: string
      name?: string
      source?: QuerySourceBinding
      sql?: string
      rowLimit?: number
    }) => {
      const draft = state.drafts[id]
      if (!draft) return

      const nextSource = source === undefined ? undefined : querySourceBindingSchema.parse(source)
      if (nextSource !== undefined && nextSource._tag !== draft._tag) delete state.results[id]

      const currentRowLimit = draft._tag === 'database' ? draft.rowLimit : undefined
      const currentRole = draft._tag === 'database' ? draft.role : undefined
      const currentEntity = draft._tag === 'database' ? draft.entity : undefined

      state.drafts[id] = toDraft({
        id,
        projectRef: draft.projectRef,
        persisted: {
          name: name ?? draft.name,
          source: nextSource ?? toQuerySourceBinding(draft),
          sql: sql ?? draft.uncheckedSql,
          updatedAt: Date.now(),
          rowLimit: rowLimit ?? currentRowLimit,
          role: currentRole,
          entity: currentEntity,
          view: draft.view,
          chart: draft.chart,
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

      if (name !== undefined || source !== undefined || rowLimit !== undefined) persist()
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

    setDisplay: ({ id, display }: { id: string; display: QueryDisplay }) => {
      const draft = state.drafts[id]
      if (!draft) return

      const parsedChart = chartConfigSchema.safeParse(display.chart)
      const updatedDraft: ExplorerQueryDraft = {
        ...draft,
        view: queryViewSchema.parse(display.view),
        chart: parsedChart.success ? parsedChart.data : undefined,
        updatedAt: Date.now(),
      }
      state.drafts[id] = updatedDraft
      persistDraft(updatedDraft)
    },

    /**
     * Separate from `updateDraft` because `undefined` is a meaningful value here (clearing
     * the impersonated role), whereas `updateDraft`'s optional fields all use `undefined`
     * to mean "leave unchanged." Logs drafts have no impersonation concept, so this is a
     * no-op for them.
     */
    setRole: ({ id, role }: { id: string; role: ImpersonationRole | undefined }) => {
      const draft = state.drafts[id]
      if (!draft || draft._tag !== 'database') return

      const updatedDraft: DatabaseQueryDraft = { ...draft, role, updatedAt: Date.now() }
      state.drafts[id] = updatedDraft
      persistDraft(updatedDraft)
    },
  })

  return state
}

export const explorerQueryState = createExplorerQueryState()

export const getExplorerQueryStateSnapshot = () => snapshot(explorerQueryState)

export const useExplorerQueryStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(explorerQueryState, options)
