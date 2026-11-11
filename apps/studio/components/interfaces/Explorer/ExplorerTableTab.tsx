import { literal, safeSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { Loader2Icon, RefreshCwIcon, SquareCodeIcon, Table2Icon } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { z } from 'zod'

import {
  buildTableViewSql,
  EMPTY_TABLE_VIEW,
  getEntityQueryColumns,
  type QueryEntityBinding,
  type TableView,
} from './entityQuery.utils'
import { ExplorerQueryResults, ExplorerQueryViewport } from './ExplorerQuery'
import { ExplorerToolbar, ExplorerToolbarAction, ExplorerToolbarActions } from './ExplorerToolbar'
import { QueryResultFooter } from './QueryEditor/QueryResultFooter'
import { QueryResultRenderer } from './QueryEditor/QueryResultRenderer'
import {
  QueryResultsDetailsToggle,
  QueryResultsPrimaryActions,
  QueryResultsWorkspace,
  useQueryResultsWorkspace,
} from './QueryEditor/QueryResultsWorkspace'
import type { QueryResult } from './types'
import { FilterPopoverNew } from '@/components/grid/components/header/filter/FilterPopoverNew'
import { SortPopoverPrimitive } from '@/components/grid/components/header/sort/SortPopoverPrimitive'
import { AddUserDropdown } from '@/components/interfaces/Auth/Users/AddUserDropdown'
import { isValidConnString } from '@/data/fetchers'
import { executeSql, useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import { entityIdQueryOptions } from '@/data/table-editor/entity-id-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import type { Entity } from '@/data/table-editor/table-editor-types'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'
import { explorerQueryState } from '@/state/explorer-query'
import {
  TableEditorTableStateContextProvider,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'

/**
 * Tables whose rows are added some other way than inserting them, in place of Add row: users
 * are created or invited through Auth, the same as on the Users page.
 */
const ADD_ACTIONS_BY_RELATION: Record<string, ComponentType> = {
  'auth.users': AddUserDropdown,
}

type ExplorerTableTabProps = {
  id: string
  entity: QueryEntityBinding
  /** The tab's saved filters and sorts. */
  tableView?: TableView
  rowLimit: number
  result?: QueryResult
  onResultChange: (result: QueryResult) => void
  /** Opens the SQL behind what's on screen as a query of its own. */
  onOpenQuery: (sql: string) => void
}

/**
 * A table opened from the Explorer sidebar. Its toolbar is the Table Editor's — filter bar,
 * sort, refresh, add row — and its rows are the same results a query shows, so they're edited,
 * described, and reviewed the same way. Open query hands over the SQL behind the rows for
 * anything the toolbar can't do.
 */
export const ExplorerTableTab = (props: ExplorerTableTabProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { grant } = useGrant('POST /platform/pg-meta/{ref}/query', { projectRef: project?.ref })
  const { data: entityId, isPending: isResolvingId } = useQuery(
    entityIdQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: props.entity.schema,
      name: props.entity.name,
      grant,
    })
  )
  const { data: tableEntity, isPending: isLoadingTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: entityId ?? undefined,
  })

  if (!project || isResolvingId || (entityId !== null && isLoadingTable)) {
    return (
      <div
        role="status"
        aria-label="Loading table"
        className="flex h-full items-center justify-center bg-surface-100"
      >
        <Loader2Icon className="animate-spin text-foreground-muted" size={18} />
      </div>
    )
  }

  if (!tableEntity) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-100">
        <Table2Icon className="text-foreground-muted" size={24} />
        <p className="text-sm">
          {props.entity.schema}.{props.entity.name} wasn't found
        </p>
        <p className="text-sm text-foreground-lighter">It may have been renamed or dropped.</p>
      </div>
    )
  }

  // A table that keeps some columns off screen keeps them out of filters and sorts too.
  const shownColumns = getEntityQueryColumns(props.entity)
  const shownEntity = shownColumns
    ? {
        ...tableEntity,
        columns: (tableEntity.columns ?? []).filter(({ name }) => shownColumns.includes(name)),
      }
    : tableEntity

  return (
    // The Table Editor's own table state, which its filter bar and sort popover read.
    <TableEditorTableStateContextProvider
      key={tableEntity.id}
      projectRef={project.ref}
      table={shownEntity}
      editable={false}
    >
      <ExplorerTableView {...props} tableEntity={shownEntity} />
    </TableEditorTableStateContextProvider>
  )
}

const ExplorerTableView = ({
  id,
  entity,
  tableView = EMPTY_TABLE_VIEW,
  rowLimit,
  tableEntity,
  result,
  onResultChange,
  onOpenQuery,
}: ExplorerTableTabProps & { tableEntity: Entity }) => {
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorTableStateSnapshot()
  const resultRef = useLatest(result)

  // The filter bar keeps its filters in the Table Editor's table state. They start from the
  // tab's saved ones and are saved back as they change, so they outlast switching tabs.
  const [isRestored, setIsRestored] = useState(false)
  const restoreFilters = useEffectEvent(() => {
    if (tableView.filters.length > 0) {
      snap.setFilters(
        tableView.filters.map(({ column, operator, value }) => ({ column, operator, value }))
      )
    }
    setIsRestored(true)
  })
  useEffect(() => restoreFilters(), [])

  const filtersKey = JSON.stringify(snap.filters)
  const saveFilters = useEffectEvent(() => {
    if (filtersKey === JSON.stringify(tableView.filters)) return
    explorerQueryState.setTableView({
      id,
      tableView: { filters: [...snap.filters], sorts: [...tableView.sorts] },
    })
  })
  useEffect(() => {
    if (isRestored) saveFilters()
  }, [isRestored, filtersKey])

  const columnFormats = Object.fromEntries(
    (tableEntity.columns ?? []).map((column) => [column.name, column.format])
  )
  const tableSql = buildTableViewSql({
    entity,
    tableView: { filters: [...snap.filters], sorts: [...tableView.sorts] },
    columnFormats,
  })

  const { mutateAsync: runSql, isPending: isRunning } = useExecuteSqlMutation({
    onError: () => {},
  })
  const workspace = useQueryResultsWorkspace({
    result,
    onResultChange,
    isEditingEnabled: !isRunning,
    hasSidebar: true,
  })

  const queryGrant = useGrant('POST /platform/pg-meta/{ref}/query', { projectRef: project?.ref })

  /** Runs the table's query: Studio builds it from the table and the toolbar, so no gesture is needed. */
  const runTableQuery = async () => {
    if (!project || !queryGrant.grant || !isValidConnString(project.connectionString)) return

    const limitedSql = applyAutoLimit(tableSql, rowLimit)
    // Edits name their rows by primary key, so they still apply after filtering or sorting.
    const pendingEdits = resultRef.current?.pendingEdits
    const querySnapshot = { sql: tableSql, source: 'database' as const }

    await runSql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: limitedSql.sql,
      autoLimit: limitedSql.appendAutoLimit ? rowLimit : undefined,
      contextualInvalidation: true,
      isStatementTimeoutDisabled: true,
      isRoleImpersonationEnabled: false,
      grant: queryGrant.grant,
    }).then(
      (data) =>
        onResultChange({
          rows: data.result,
          ...querySnapshot,
          editingContext: { projectRef: project.ref },
          pendingEdits,
          // A full page under the auto limit means there may be more rows to load.
          canLoadMore: limitedSql.appendAutoLimit && rowLimit > 0 && data.result.length >= rowLimit,
        }),
      (error) => onResultChange({ error, ...querySnapshot, pendingEdits })
    )
  }
  // Keeps the rows in step with the table and its filters and sorts: runs on open, and again
  // whenever they change what the query asks for. Returning to a tab shows what it had.
  const requestedSqlRef = useRef<string>(undefined)
  const syncRows = useEffectEvent(() => {
    if (!isRestored || !project || !queryGrant.grant) return
    if (result?.sql === tableSql || requestedSqlRef.current === tableSql) return
    requestedSqlRef.current = tableSql
    runTableQuery()
  })
  useEffect(() => syncRows(), [isRestored, tableSql, project?.ref, queryGrant.grant])

  const handleRefresh = () => {
    requestedSqlRef.current = tableSql
    runTableQuery()
  }

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const handleLoadMore = async () => {
    const current = resultRef.current
    if (!project || !queryGrant.grant || !current?.rows || rowLimit <= 0) return

    setIsLoadingMore(true)
    try {
      const { result: page } = await executeSql({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: safeSql`${tableSql} limit ${literal(rowLimit)} offset ${literal(current.rows.length)}`,
        grant: queryGrant.grant,
      })
      const rows = z.array(z.record(z.unknown())).parse(page)
      // A new run may have replaced the result while this page loaded.
      const latest = resultRef.current
      if (latest !== current || !latest.rows) return
      onResultChange({
        ...latest,
        rows: [...latest.rows, ...rows],
        canLoadMore: rows.length >= rowLimit,
      })
    } catch (error) {
      toast.error(
        `Failed to load more rows: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const name = `${entity.schema}.${entity.name}`
  const AddAction = ADD_ACTIONS_BY_RELATION[name]
  const isResultCurrent = result?.sql === tableSql

  return (
    <ExplorerQueryViewport>
      {/* The filter bar pads its own search icon, so the toolbar's left padding is trimmed to
          line the icon up with other toolbars' 16px inset. */}
      <ExplorerToolbar aria-label={`${name} toolbar`} className="pl-0.5 pr-4">
        <FilterPopoverNew isRefetching={isRunning} />
        <ExplorerToolbarActions className="gap-x-1">
          <SortPopoverPrimitive
            sorts={[...tableView.sorts]}
            onApplySorts={(sorts) =>
              explorerQueryState.setTableView({
                id,
                tableView: { filters: [...snap.filters], sorts },
              })
            }
          />
          <ExplorerToolbarAction
            icon={
              <RefreshCwIcon
                size={16}
                strokeWidth={2}
                className={cn(isRunning && 'animate-spin')}
              />
            }
            aria-label="Refresh"
            tooltip="Refresh"
            disabled={isRunning}
            onClick={handleRefresh}
          />
          <QueryResultsDetailsToggle workspace={workspace} />
          <ExplorerToolbarAction
            icon={<SquareCodeIcon size={16} strokeWidth={2} />}
            aria-label="Open query"
            tooltip="Open query"
            onClick={() => onOpenQuery(tableSql)}
          />
          {AddAction && (
            <div className="ml-2">
              <AddAction />
            </div>
          )}
          <QueryResultsPrimaryActions
            workspace={workspace}
            canAddRow={!isRunning && AddAction === undefined}
          />
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      <QueryResultsWorkspace
        workspace={workspace}
        detailsSql={tableSql}
        isShortcutEnabled
        footer={
          <QueryResultFooter
            results={result?.rows}
            count={(result?.rows ?? []).length}
            rowLimit={rowLimit}
            fileName={name}
            onLoadMore={
              isResultCurrent && result?.canLoadMore && !isRunning ? handleLoadMore : undefined
            }
            isLoadingMore={isLoadingMore}
          />
        }
      >
        <ExplorerQueryResults className="h-full">
          <QueryResultRenderer
            view="table"
            result={result}
            sql={result?.sql}
            source={result?.source}
            editing={workspace.editing}
            isRunning={isRunning || result === undefined}
            rowSelection={workspace.rowSelection}
          />
        </ExplorerQueryResults>
      </QueryResultsWorkspace>
    </ExplorerQueryViewport>
  )
}
