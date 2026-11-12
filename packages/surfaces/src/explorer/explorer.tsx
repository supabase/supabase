import type {
  Capabilities,
  LogWindow,
  QueryDisplay,
  QuerySource,
  TableSummary,
} from '@supabase/mcp-server-supabase/apps'
import { DatabaseIcon } from 'lucide-react'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import type { Loadable } from '../common'
import { QueryEditor, type QueryEditorHandle } from '../query/query-editor'
import { entityId, tableSql, type Entity, type RunQuery } from '../query/query-model'
import type { SqlEditorComponent } from '../query/sql-editor'
import type { SaveRow } from '../row/row-editor'
import { ExplorerSidebar } from './explorer-sidebar'

/** SQL to open in the Explorer's query editor. */
export interface ExplorerQueryInput {
  title: string
  sql: string
  source?: QuerySource
  logWindow?: LogWindow
  display?: QueryDisplay
}

/** The SQL draft's id for `ExplorerHandle.editor`. A table's id is its `entityId`. */
export const EXPLORER_QUERY_ID = 'query'

/** What the host may read to describe the Explorer, e.g. as agent context. Never includes rows. */
export interface ExplorerState {
  /** What the editor shows: a table's rows, the SQL draft, or nothing yet. */
  view: 'none' | 'table' | 'query'
  /** `EXPLORER_QUERY_ID`, the table's `entityId`, or null. */
  activeId: string | null
  entity?: Entity
  /** The SQL draft, kept while the user browses tables. */
  query: { isOpen: boolean; isDirty: boolean; source: QuerySource }
}

/** Lets a host, or an agent acting through it, drive the Explorer. Nothing here runs custom SQL. */
export interface ExplorerHandle {
  openTable(entity: Entity): string
  /** Replaces the SQL draft. Throws if the user has edited it, so their work is never lost. */
  openQuery(query: ExplorerQueryInput): string
  /** The editor for the SQL draft or the table shown, by id. */
  editor(id: string): QueryEditorHandle | undefined
}

export interface ExplorerProps {
  capabilities: Pick<Capabilities, 'readOnly' | 'database'>
  /** The schema the sidebar lists. The host loads its tables. */
  schema: string
  onSchemaChange: (schema: string) => void
  schemas: Loadable<string[]>
  tables: Loadable<TableSummary[]>
  /** Asks the host to load schemas and tables again. */
  onRetryNavigation: () => void
  /** Runs SQL for a table or the SQL draft. Agent edits never run until the user clicks Run. */
  onRunQuery: RunQuery
  /** Saves an edited or inserted row. Omit to make results read-only. */
  onSaveRow?: SaveRow
  SqlEditor: SqlEditorComponent
  onStateChange?: (state: ExplorerState) => void
  ref?: Ref<ExplorerHandle>
}

type View = { kind: 'table'; entity: Entity } | { kind: 'query' } | undefined

function listState<T>(value: Loadable<T>) {
  return {
    data: value.status === 'success' ? value.data : undefined,
    error: value.status === 'error' ? value.message : '',
    isLoading: value.status === 'loading',
  }
}

const BLANK_QUERY: ExplorerQueryInput = { title: 'Untitled query', sql: '' }

/**
 * Browse a database's tables and write SQL. The sidebar lists a schema's tables, and the
 * editor shows what is selected: a table's rows, or the SQL draft. Hosts with their own tabs,
 * such as chat panels, open one Explorer per panel instead of tabs inside it.
 */
export function Explorer({
  capabilities,
  schema,
  onSchemaChange,
  schemas: schemaLoad,
  tables: tableLoad,
  onRetryNavigation,
  onRunQuery,
  onSaveRow,
  SqlEditor,
  onStateChange,
  ref,
}: ExplorerProps) {
  const [view, setView] = useState<View>()
  // The draft stays mounted once opened, so browsing tables never loses it.
  const [draft, setDraft] = useState<{ key: number; input: ExplorerQueryInput }>()
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const [pendingReplace, setPendingReplace] = useState<ExplorerQueryInput>()
  const [search, setSearch] = useState('')
  const tableEditor = useRef<QueryEditorHandle | null>(null)
  const queryEditor = useRef<QueryEditorHandle | null>(null)
  const draftKey = useRef(0)

  const schemas = listState(schemaLoad)
  const tables = listState(tableLoad)
  const tableList = (tables.data ?? [])
    .map((table) => ({
      ...table,
      name: table.name.startsWith(`${schema}.`) ? table.name.slice(schema.length + 1) : table.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const activeId =
    view?.kind === 'table'
      ? entityId(view.entity)
      : view?.kind === 'query'
        ? EXPLORER_QUERY_ID
        : null

  function openTable(entity: Entity) {
    if (entity.schema !== schema) {
      onSchemaChange(entity.schema)
      setSearch('')
    }
    setView({ kind: 'table', entity })
    return entityId(entity)
  }

  function replaceDraft(input: ExplorerQueryInput) {
    setDraft({ key: ++draftKey.current, input })
    setIsDraftDirty(false)
    setView({ kind: 'query' })
    return EXPLORER_QUERY_ID
  }

  function openSql() {
    if (!draft) replaceDraft(BLANK_QUERY)
    else setView({ kind: 'query' })
  }

  /** Open query from a table: asks before discarding an edited draft. */
  function handleOpenQuery(input: ExplorerQueryInput) {
    if (isDraftDirty) setPendingReplace(input)
    else replaceDraft(input)
  }

  useImperativeHandle(ref, () => ({
    openTable,
    openQuery(input) {
      if (isDraftDirty)
        throw new Error(
          'The SQL draft has unsaved edits. Read it and revise it with set_query_draft instead.'
        )
      return replaceDraft(input)
    },
    editor(id) {
      if (id === EXPLORER_QUERY_ID) return queryEditor.current ?? undefined
      return id === activeId ? (tableEditor.current ?? undefined) : undefined
    },
  }))

  const state: ExplorerState = {
    view: view?.kind ?? 'none',
    activeId,
    ...(view?.kind === 'table' ? { entity: view.entity } : {}),
    query: {
      isOpen: !!draft,
      isDirty: isDraftDirty,
      source: draft?.input.source ?? 'database',
    },
  }
  const stateKey = JSON.stringify(state)
  useEffect(() => {
    onStateChange?.(state)
    // Reports only when the described state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey])

  const editorProps = {
    onRun: onRunQuery,
    onSaveRow: capabilities.readOnly ? undefined : onSaveRow,
    SqlEditor,
    readOnly: capabilities.readOnly,
  }

  return (
    <div className="flex min-h-0 flex-1">
      <ExplorerSidebar
        schema={schema}
        schemas={schemas.data ?? []}
        tables={tableList}
        search={search}
        onSearchChange={setSearch}
        activeTable={
          view?.kind === 'table' && view.entity.schema === schema ? view.entity.name : undefined
        }
        isQueryActive={view?.kind === 'query'}
        canWriteSql={capabilities.database}
        isSchemaLoading={schemas.isLoading}
        isTableLoading={tables.isLoading}
        schemaError={schemas.error}
        tableError={tables.error}
        onSelectSchema={(next) => {
          onSchemaChange(next)
          setSearch('')
        }}
        onOpenTable={openTable}
        onOpenSql={openSql}
        onRetry={onRetryNavigation}
      />
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Explorer">
        {!view && (
          <div className="p-4">
            <EmptyStatePresentational
              icon={DatabaseIcon}
              title="Browse your data"
              description="Choose a table to see its rows, or use Run SQL to write a query."
            />
          </div>
        )}
        {view?.kind === 'table' && (
          <QueryEditor
            key={entityId(view.entity)}
            ref={tableEditor}
            {...editorProps}
            title={view.entity.name}
            initialSql={tableSql(view.entity)}
            entity={view.entity}
            onOpenQuery={capabilities.database ? handleOpenQuery : undefined}
            onDirtyChange={() => {}}
          />
        )}
        {draft && (
          <div className="flex min-h-0 flex-1 flex-col" hidden={view?.kind !== 'query'}>
            <QueryEditor
              key={draft.key}
              ref={queryEditor}
              {...editorProps}
              title={draft.input.title}
              initialSql={draft.input.sql}
              initialDisplay={draft.input.display}
              source={draft.input.source}
              logWindow={draft.input.logWindow}
              onDirtyChange={setIsDraftDirty}
            />
          </div>
        )}
      </section>
      <ConfirmationModal
        visible={!!pendingReplace}
        title="Replace your SQL draft?"
        description="Your edits to the current SQL draft will be discarded."
        cancelLabel="Keep draft"
        confirmLabel="Replace draft"
        variant="destructive"
        onCancel={() => setPendingReplace(undefined)}
        onConfirm={() => {
          if (pendingReplace) replaceDraft(pendingReplace)
          setPendingReplace(undefined)
        }}
      />
    </div>
  )
}
