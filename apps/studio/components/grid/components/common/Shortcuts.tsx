import { RefObject, useContext } from 'react'
import type { DataGridHandle } from 'react-data-grid'

import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import { useTableSort } from '@/components/grid/hooks/useTableSort'
import { SupaRow } from '@/components/grid/types'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import {
  TableEditorTableStateContext,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'

type ShortcutsProps = {
  gridRef: RefObject<DataGridHandle>
  rows: SupaRow[]
}

export function Shortcuts({ gridRef, rows }: ShortcutsProps) {
  const snap = useTableEditorTableStateSnapshot()
  const state = useContext(TableEditorTableStateContext)
  const canStartNavigation = !snap.selectedCellPosition && rows.length > 0

  const { filters, clearFilters } = useTableFilter()
  const { sorts, onApplySorts } = useTableSort()

  const startGridNavigation = () => {
    const frozenColumns = snap.gridColumns.filter((x) => x.frozen)
    gridRef.current?.selectCell({
      idx: frozenColumns.length,
      rowIdx: 0,
    })
  }

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW, () => {
    if (snap.selectedCellPosition) {
      gridRef.current!.selectCell({
        idx: snap.selectedCellPosition?.idx ?? 0,
        rowIdx: 0,
      })
    } else {
      gridRef.current!.scrollToCell({ rowIdx: 0 })
    }
  })

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_ROW, () => {
    if (snap.selectedCellPosition) {
      gridRef.current!.selectCell({
        idx: snap.selectedCellPosition?.idx ?? 0,
        rowIdx: rows.length > 1 ? rows.length - 1 : 0,
      })
    } else {
      gridRef.current!.scrollToCell({ rowIdx: rows.length })
    }
  })

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_COL, () => {
    const frozenColumns = snap.gridColumns.filter((x) => x.frozen)
    gridRef.current!.selectCell({
      idx: frozenColumns.length,
      rowIdx: snap.selectedCellPosition?.rowIdx ?? 0,
    })
  })

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_COL, () => {
    gridRef.current?.selectCell({
      idx: snap.gridColumns.length - 2,
      rowIdx: snap.selectedCellPosition?.rowIdx ?? 0,
    })
  })

  useShortcut(
    SHORTCUT_IDS.TABLE_EDITOR_TOGGLE_ROW_SELECTION,
    () => {
      const rowIdx = state.selectedCellPosition?.rowIdx
      if (rowIdx === undefined) return

      const row = rows[rowIdx]
      if (!row) return

      const next = new Set(state.selectedRows)
      if (next.has(row.idx)) next.delete(row.idx)
      else next.add(row.idx)

      state.setSelectedRows(next)
    },
    {
      enabled: !!snap.selectedCellPosition,
    }
  )

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_DOWN, startGridNavigation, {
    enabled: canStartNavigation,
  })

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_UP, startGridNavigation, {
    enabled: canStartNavigation,
  })

  useShortcut(
    SHORTCUT_IDS.TABLE_EDITOR_EXIT_SELECTION,
    () => {
      snap.setSelectedCellPosition(null)
      ;(document.activeElement as HTMLElement | null)?.blur()
    },
    {
      enabled: !!snap.selectedCellPosition,
    }
  )

  useShortcut(
    SHORTCUT_IDS.TABLE_EDITOR_FOCUS_FILTERS,
    () => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-testid="filter-bar-freeform-input"]'
      )
      input?.focus()
    },
    {
      registerInCommandMenu: true,
    }
  )

  useShortcut(
    SHORTCUT_IDS.TABLE_EDITOR_CLEAR_FILTERS,
    () => {
      clearFilters()
    },
    {
      registerInCommandMenu: true,
      enabled: filters.length > 0,
    }
  )

  useShortcut(SHORTCUT_IDS.TABLE_EDITOR_CLEAR_SORT, () => onApplySorts([]), {
    registerInCommandMenu: true,
    enabled: sorts.length > 0,
  })

  return null
}
