import { useEffect, useRef, useState } from 'react'
import { DataGridHandle } from 'react-data-grid'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPortal } from 'react-dom'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  cleanupProps,
  formatFilterURLParams,
  formatSortURLParams,
  getStorageKey,
  saveStorageDebounced,
} from './SupabaseGrid.utils'
import { Shortcuts } from './components/common/Shortcuts'
import Footer from './components/footer/Footer'
import { Grid } from './components/grid/Grid'
import Header from './components/header/Header'
import { RowContextMenu } from './components/menu'
import { STORAGE_KEY_PREFIX } from './constants'
import { StoreProvider, useDispatch, useTrackedState } from './store/Store'
import { InitialStateType } from './store/reducers'
import type { SupabaseGridProps } from './types'
import { getGridColumns } from './utils/gridColumns'

function onLoadStorage(storageRef: string, tableName: string, schema?: string | null) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, storageRef)
  const jsonStr = localStorage.getItem(storageKey)
  if (!jsonStr) return
  const json = JSON.parse(jsonStr)
  const tableKey = !schema || schema == 'public' ? tableName : `${schema}.${tableName}`
  return json[tableKey]
}

async function initTable(
  props: SupabaseGridProps,
  state: InitialStateType,
  dispatch: (value: any) => void,
  sort?: string[], // Comes directly from URL param
  filter?: string[] // Comes directly from URL param
): Promise<{ savedState: { sorts?: string[]; filters?: string[] } }> {
  const savedState = props.projectRef
    ? onLoadStorage(props.projectRef, props.table.name, props.table.schema)
    : undefined

  // Check for saved state on initial load and also, load sort and filters via URL param only if given
  // Otherwise load from local storage to resume user session
  if (
    !state.isInitialComplete &&
    sort === undefined &&
    filter === undefined &&
    (savedState?.sorts || savedState?.filters)
  ) {
    return {
      savedState: {
        sorts: savedState.sorts,
        filters: savedState.filters,
      },
    }
  }

  const gridColumns = getGridColumns(props.table, {
    projectRef: props.projectRef,
    tableId: props.tableId,
    editable: props.editable,
    defaultWidth: props.gridProps?.defaultColumnWidth,
    onAddColumn: props.editable ? props.onAddColumn : undefined,
    onExpandJSONEditor: props.onExpandJSONEditor,
    onExpandTextEditor: props.onExpandTextEditor,
  })

  const defaultErrorHandler = (error: any) => {
    console.error('Supabase grid error: ', error)
  }

  dispatch({
    type: 'INIT_TABLE',
    payload: {
      table: props.table,
      gridProps: props.gridProps,
      gridColumns,
      savedState,
      editable: props.editable,
      onError: props.onError ?? defaultErrorHandler,
    },
  })

  return { savedState: {} }
}

/** Supabase Grid: React component to render database table */

export const SupabaseGrid = (props: SupabaseGridProps) => {
  const _props = cleanupProps(props)

  return (
    <StoreProvider>
      <DndProvider backend={HTML5Backend} context={window}>
        <SupabaseGridLayout {..._props} />
      </DndProvider>
    </StoreProvider>
  )
}

const SupabaseGridLayout = (props: SupabaseGridProps) => {
  const {
    editable,
    projectRef,
    gridProps,
    headerActions,
    showCustomChildren,
    customHeader,
    children,
    onAddRow,
    onAddColumn,
    updateTableRow,
    onEditForeignKeyColumnValue,
    onImportData,
  } = props
  const { id: tableId } = useParams()
  const dispatch = useDispatch()
  const state = useTrackedState()
  const snap = useTableEditorStateSnapshot()

  const gridRef = useRef<DataGridHandle>(null)
  const [mounted, setMounted] = useState(false)

  const [{ sort, filter }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })
  const sorts = formatSortURLParams(props.table.name, sort as string[] | undefined)
  const filters = formatFilterURLParams(filter as string[])

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { project } = useProjectContext()
  const { data, error, isSuccess, isError, isLoading, isRefetching } = useTableRowsQuery(
    {
      queryKey: [props.table.schema, props.table.name],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table: props.table,
      sorts,
      filters,
      page: snap.page,
      limit: snap.rowsPerPage,
      impersonatedRole: roleImpersonationState.role,
    },
    {
      keepPreviousData: true,
      retryDelay: (retryAttempt, error: any) => {
        if (error && error.message?.includes('does not exist')) {
          setParams((prevParams) => {
            return {
              ...prevParams,
              ...{ sort: undefined },
            }
          })
        }
        if (retryAttempt > 3) {
          return Infinity
        }
        return 5000
      },
      onSuccess(data) {
        dispatch({
          type: 'SET_ROWS_COUNT',
          payload: data.rows.length,
        })
      },
    }
  )

  useEffect(() => {
    if (!mounted) setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      dispatch({ type: 'UPDATE_FILTERS', payload: {} })
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    if (mounted) {
      dispatch({ type: 'UPDATE_SORTS', payload: {} })
    }
  }, [JSON.stringify(sorts)])

  useEffect(() => {
    if (state.isInitialComplete && projectRef && state.table) {
      saveStorageDebounced(state, projectRef, sort as string[], filter as string[])
    }
  }, [
    state.table,
    state.isInitialComplete,
    state.gridColumns,
    JSON.stringify(sorts),
    JSON.stringify(filters),
    projectRef,
  ])

  useEffect(() => {
    dispatch({
      type: 'INIT_CALLBACK',
      payload: { ...props },
    })
  }, [])

  useEffect(() => {
    const initializeData = async () => {
      const { savedState } = await initTable(
        { ...props, tableId },
        state,
        dispatch,
        sort as string[],
        filter as string[]
      )

      if (savedState.sorts || savedState.filters) {
        setParams((prevParams) => {
          return {
            ...prevParams,
            ...(savedState.sorts && { sort: savedState.sorts }),
            ...(savedState.filters && { filter: savedState.filters }),
          }
        })
      }
    }

    const refreshTable = JSON.stringify(props.table) !== JSON.stringify(state.table)

    if (!state.table || refreshTable) {
      initializeData()
    }
  }, [state.table, props.table, props.schema])

  return (
    <div className="sb-grid h-full flex flex-col">
      <Header
        table={props.table}
        sorts={sorts}
        filters={filters}
        onAddRow={editable ? onAddRow : undefined}
        onAddColumn={editable ? onAddColumn : undefined}
        onImportData={editable ? onImportData : undefined}
        headerActions={headerActions}
        customHeader={customHeader}
      />
      {showCustomChildren && children !== undefined ? (
        <>{children}</>
      ) : (
        <>
          <Grid
            ref={gridRef}
            {...gridProps}
            rows={data?.rows ?? []}
            error={error}
            isLoading={isLoading}
            isSuccess={isSuccess}
            isError={isError}
            filters={filters}
            setParams={setParams}
            updateRow={updateTableRow}
            onAddRow={onAddRow}
            onImportData={onImportData}
            onEditForeignKeyColumnValue={onEditForeignKeyColumnValue}
          />
          <Footer isRefetching={isRefetching} />
          <Shortcuts gridRef={gridRef} />
        </>
      )}

      {mounted && createPortal(<RowContextMenu rows={data?.rows ?? []} />, document.body)}
    </div>
  )
}
