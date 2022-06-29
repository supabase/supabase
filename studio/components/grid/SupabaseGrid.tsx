import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { useMonaco } from '@monaco-editor/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dictionary, SupabaseGridProps, SupabaseGridRef } from './types'
import { DataGridHandle } from '@supabase/react-data-grid'
import { RowContextMenu } from './components/menu'
import { StoreProvider, useDispatch, useTrackedState } from './store'
import { fetchCount, fetchPage, refreshPageDebounced } from './utils'
import { REFRESH_PAGE_IMMEDIATELY, TOTAL_ROWS_RESET } from './constants'
import { Grid } from './components/grid'
import { Shortcuts } from './components/common'
import Header from './components/header'
import Footer from './components/footer'
import { cleanupProps, initTable, saveStorageDebounced } from './SupabaseGrid.utils'

/**
 * Supabase Grid.
 *
 * React component to render database table.
 */
export const SupabaseGrid = forwardRef<SupabaseGridRef, SupabaseGridProps>((props, ref) => {
  const monaco = useMonaco()
  const _props = cleanupProps(props)
  const { theme } = _props

  useEffect(() => {
    if (monaco) {
      const darkTheme = theme && theme === 'dark' ? true : false
      monaco.editor.defineTheme('supabase', {
        base: darkTheme ? 'vs-dark' : 'vs',
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          { token: 'predefined.sql', foreground: '999999' },
        ],
        colors: {
          'editor.background': darkTheme ? '#222222' : '#fbfcfd',
        },
      })
    }
  }, [monaco, theme])

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
  const [mounted, setMount] = useState(false)

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
    if (!mounted) setMount(true)
  }, [])

  useEffect(() => {
    if (state.isInitialComplete && storageRef && state.table) {
      saveStorageDebounced(state, storageRef)
    }
  }, [
    state.table,
    state.isInitialComplete,
    state.gridColumns,
    state.sorts,
    state.filters,
    storageRef,
  ])

  useEffect(() => {
    if (state.refreshPageFlag == REFRESH_PAGE_IMMEDIATELY) {
      fetchPage(state, dispatch)
    } else if (state.refreshPageFlag != 0) {
      refreshPageDebounced(state, dispatch)
    }
  }, [state.refreshPageFlag])

  useEffect(() => {
    if (state.totalRows === TOTAL_ROWS_RESET) {
      fetchCount(state, dispatch)
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
      initTable(props, state, dispatch)
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
