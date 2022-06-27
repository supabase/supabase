import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { isEqual } from 'lodash'
import { createPortal } from 'react-dom'
import { useMonaco } from '@monaco-editor/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DataGridHandle } from '@supabase/react-data-grid'

import { Dictionary, SupabaseGridProps, SupabaseGridRef } from './types'
import { StoreProvider, useDispatch, useTrackedState } from './store'
import { fetchCount, fetchPage, refreshPageDebounced } from './utils'
import { REFRESH_PAGE_IMMEDIATELY, TOTAL_ROWS_RESET } from './constants'
import { Shortcuts } from './components/common'
import { Grid } from './components/grid'
import Header from './components/header'
import Footer from './components/footer'
import { RowContextMenu } from './components/menu'
import { cleanupProps, initTable, saveStorageDebounced } from './SupabaseGrid.utils'

import { useUrlState } from 'hooks'

/**
 * Supabase Grid: React component to render database table.
 */

// [JOSHEN TODO] Updating of rows when filters updating feels very choppy
// Rows do not get updated immediately for some reason despite a short debounce

export const SupabaseGrid = forwardRef<SupabaseGridRef, SupabaseGridProps>((props, ref) => {
  const monaco = useMonaco()
  const _props = cleanupProps(props)
  const { theme } = _props

  useEffect(() => {
    if (monaco) {
      const darkTheme = theme && theme === 'dark' ? true : false

      monaco.editor.defineTheme('supabase', {
        base: 'vs-dark', // can also be vs-dark or hc-black
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          { token: 'predefined.sql', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': darkTheme ? '#1f1f1f' : '#30313f',
        },
      })
    }
  }, [monaco])

  return (
    <StoreProvider>
      <DndProvider backend={HTML5Backend}>
        <SupabaseGridLayout ref={ref} {..._props} />
      </DndProvider>
    </StoreProvider>
  )
})

const SupabaseGridLayout = forwardRef<SupabaseGridRef, SupabaseGridProps>((props, ref) => {
  const { editable, storageRef, gridProps, headerActions } = props
  const dispatch = useDispatch()
  const state = useTrackedState()

  const gridRef = useRef<DataGridHandle>(null)
  const [mounted, setMounted] = useState(false)

  const [{ sort: sorts, filter: filters }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })

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
    if (state.refreshPageFlag == REFRESH_PAGE_IMMEDIATELY) {
      fetchPage(state, dispatch, sorts as string[], filters as string[])
    } else if (state.refreshPageFlag !== 0) {
      refreshPageDebounced(state, dispatch, sorts as string[], filters as string[])
    }
  }, [state.refreshPageFlag])

  useEffect(() => {
    if (mounted) {
      dispatch({ type: 'UPDATE_FILTERS_SORTS', payload: {} })
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    if (state.isInitialComplete && storageRef && state.table) {
      saveStorageDebounced(state, storageRef)
    }
  }, [
    state.table,
    state.isInitialComplete,
    state.gridColumns,
    state.sorts, // [JOSHEN TODO] To update accordingly
    // state.filters, // [JOSHEN TODO] To update accordingly
    storageRef,
  ])

  useEffect(() => {
    if (state.totalRows === TOTAL_ROWS_RESET) {
      fetchCount(state, dispatch, filters as string[])
    }
  }, [state.totalRows])

  useEffect(() => {
    if (!state.metaService) {
      dispatch({
        type: 'INIT_CLIENT',
        payload: { onSqlQuery: props.onSqlQuery },
      })
      dispatch({
        type: 'INIT_CALLBACK',
        payload: { ...props },
      })
    }
  }, [state.metaService])

  useEffect(() => {
    if (!state.metaService) return

    if (
      !state.table ||
      (typeof props.table == 'string' &&
        state.table!.name != props.table &&
        state.table!.schema != props.schema) ||
      (typeof props.table != 'string' &&
        JSON.stringify(props.table) !== JSON.stringify(state.table))
    ) {
      initTable(props, state, dispatch, sorts as string[], filters as string[])
    }
  }, [state.metaService, state.table, props.table, props.schema])

  return (
    <div className="sb-grid">
      <Header
        onAddRow={editable ? props.onAddRow : undefined}
        onAddColumn={editable ? props.onAddColumn : undefined}
        headerActions={headerActions}
      />
      <Grid ref={gridRef} {...gridProps} rows={state.rows} />
      <Footer />
      <Shortcuts gridRef={gridRef} />
      {mounted && createPortal(<RowContextMenu />, document.body)}
    </div>
  )
})
