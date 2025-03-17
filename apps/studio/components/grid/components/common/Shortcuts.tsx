import { useMemo } from 'react'
import type { DataGridHandle } from 'react-data-grid'

import { SupaRow } from 'components/grid/types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { useTrackedState } from '../../store/Store'
import { copyToClipboard, formatClipboardValue } from '../../utils/common'
import { useKeyboardShortcuts } from './Hooks'

type ShortcutsProps = {
  gridRef: React.RefObject<DataGridHandle>
  rows: SupaRow[]
}

export function Shortcuts({ gridRef, rows }: ShortcutsProps) {
  const snap = useTableEditorTableStateSnapshot()
  const state = useTrackedState()
  const { gridColumns } = state

  const metaKey = useMemo(() => {
    function getClientOS() {
      return navigator?.appVersion.indexOf('Win') !== -1
        ? 'windows'
        : navigator?.appVersion.indexOf('Mac') !== -1
          ? 'macos'
          : 'unknown'
    }
    return getClientOS() === 'windows' ? 'Control' : 'Command'
  }, [])

  useKeyboardShortcuts(
    {
      [`${metaKey}+ArrowUp`]: (event) => {
        event.stopPropagation()
        if (snap.selectedCellPosition) {
          const position = {
            idx: snap.selectedCellPosition?.idx ?? 0,
            rowIdx: 0,
          }
          gridRef.current!.selectCell(position)
        } else {
          gridRef.current!.scrollToCell({ rowIdx: Number(0) })
        }
      },
      [`${metaKey}+ArrowDown`]: (event) => {
        event.stopPropagation()
        if (snap.selectedCellPosition) {
          const position = {
            idx: snap.selectedCellPosition?.idx ?? 0,
            rowIdx: rows.length > 1 ? rows.length - 1 : 0,
          }
          gridRef.current!.selectCell(position)
        } else {
          gridRef.current!.scrollToCell({ rowIdx: Number(rows.length) })
        }
      },
      [`${metaKey}+ArrowLeft`]: (event) => {
        event.stopPropagation()
        const fronzenColumns = gridColumns.filter((x) => x.frozen)
        const position = {
          idx: fronzenColumns.length,
          rowIdx: snap.selectedCellPosition?.rowIdx ?? 0,
        }
        gridRef.current!.selectCell(position)
      },
      [`${metaKey}+ArrowRight`]: (event) => {
        event.stopPropagation()
        gridRef.current?.selectCell({
          idx: gridColumns.length - 2, // -2 because we don't want to select the end extra col
          rowIdx: snap.selectedCellPosition?.rowIdx ?? 0,
        })
      },
      [`${metaKey}+c`]: (event) => {
        event.stopPropagation()
        if (snap.selectedCellPosition) {
          const { idx, rowIdx } = snap.selectedCellPosition
          if (idx > 0) {
            const colKey = gridColumns[idx].key
            const cellValue = rows[rowIdx]?.[colKey] ?? ''
            const value = formatClipboardValue(cellValue)
            copyToClipboard(value)
          }
        }
      },
    },
    ['INPUT', 'TEXTAREA', 'SELECT']
  )

  return null
}
