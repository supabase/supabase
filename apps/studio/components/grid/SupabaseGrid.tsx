import { DataGridHandle } from 'react-data-grid'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPortal } from 'react-dom'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useUrlState } from 'hooks'
import {
  cleanupProps,
  formatFilterURLParams,
  formatSortURLParams,
  initTable,
  saveStorageDebounced,
} from './SupabaseGrid.utils'
import { Shortcuts } from './components/common'
import Footer from './components/footer'
import { Grid } from './components/grid'
import Header from './components/header'
import { RowContextMenu } from './components/menu'
import { StoreProvider, useDispatch, useTrackedState } from './store'
import { Dictionary, SupabaseGridProps, SupabaseGridRef } from './types'

/** Supabase Grid: React component to render database table */

export const SupabaseGrid = forwardRef<SupabaseGridRef, SupabaseGridProps>((props, ref) => {
  const _props = cleanupProps(props)

  return (
    <StoreProvider>
      <DndProvider backend={HTML5Backend}>
        <SupabaseGridLayout ref={ref} {..._props} />
      </DndProvider>
    </StoreProvider>
  )
})

const SupabaseGridLayout = forwardRef<SupabaseGridRef, SupabaseGridProps>(
  function SupabaseGridLayout(props, ref) {
    const {
      editable,
      storageRef,
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
    const dispatch = useDispatch()
    const state = useTrackedState()

    const gridRef = useRef<DataGridHandle>(null)
    const [mounted, setMounted] = useState(false)

    const [{ sort, filter }, setParams] = useUrlState({
      arrayKeys: ['sort', 'filter'],
    })
    const sorts = formatSortURLParams(sort as string[])
    const filters = formatFilterURLParams(filter as string[])

    const { project } = useProjectContext()
    const { data, error, isSuccess, isError, isLoading, isRefetching } = useTableRowsQuery(
      {
        queryKey: [props.table.schema, props.table.name],
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        table: props.table,
        sorts,
        filters,
        page: state.page,
        limit: state.rowsPerPage,
      },
      {
        keepPreviousData: true,
        onSuccess(data) {
          dispatch({
            type: 'SET_ROWS_COUNT',
            payload: data.rows.length,
          })
        },
      }
    )

    useImperativeHandle(ref, () => ({
      rowAdded(row: Dictionary<any>) {
        dispatch({
          type: 'ADD_NEW_ROW',
          payload: row,
        })
      },
      rowEdited(row: Dictionary<any>, idx: number) {
        dispatch({
          type: 'EDIT_ROW',
          payload: { row, idx },
        })
      },
    }))

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
      if (state.isInitialComplete && storageRef && state.table) {
        saveStorageDebounced(state, storageRef, sort as string[], filter as string[])
      }
    }, [
      state.table,
      state.isInitialComplete,
      state.gridColumns,
      JSON.stringify(sorts),
      JSON.stringify(filters),
      storageRef,
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
          props,
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
      <div className="sb-grid">
        <Header
          table={props.table}
          sorts={sorts}
          filters={filters}
          isRefetching={isRefetching}
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
            <Footer isLoading={isLoading || isRefetching} />
            <Shortcuts gridRef={gridRef} />
          </>
        )}

        {mounted && createPortal(<RowContextMenu rows={data?.rows ?? []} />, document.body)}
      </div>
    )
  }
)
