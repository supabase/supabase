import * as React from 'react'
import type { DataGridHandle } from 'react-data-grid'
import { useTrackedState } from '../../store/Store'
import { copyToClipboard, formatClipboardValue } from '../../utils/common'
import { useKeyboardShortcuts } from './Hooks'

type ShortcutsProps = {
  gridRef: React.RefObject<DataGridHandle>
}

export function Shortcuts({ gridRef }: ShortcutsProps) {
  const state = useTrackedState()
  const { rows, gridColumns, selectedCellPosition } = state
  const [metaKey, setMetaKey] = React.useState('Command')

  React.useEffect(() => {
    function getClientOS() {
      return navigator?.appVersion.indexOf('Win') !== -1
        ? 'windows'
        : navigator?.appVersion.indexOf('Mac') !== -1
          ? 'macos'
          : 'unknown'
    }
    const metakey = getClientOS() === 'windows' ? 'Control' : 'Command'
    setMetaKey(metakey)
  }, [])

  useKeyboardShortcuts(
    {
      [`${metaKey}+ArrowUp`]: (event) => {
        event.stopPropagation()
        if (selectedCellPosition) {
          const position = {
            idx: selectedCellPosition?.idx ?? 0,
            rowIdx: 0,
          }
          gridRef.current!.selectCell(position)
        } else {
          gridRef.current!.scrollToCell({ rowIdx: Number(0) })
        }
      },
      [`${metaKey}+ArrowDown`]: (event) => {
        event.stopPropagation()
        if (selectedCellPosition) {
          const position = {
            idx: selectedCellPosition?.idx ?? 0,
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
          rowIdx: selectedCellPosition?.rowIdx ?? 0,
        }
        gridRef.current!.selectCell(position)
      },
      [`${metaKey}+ArrowRight`]: (event) => {
        event.stopPropagation()
        gridRef.current?.selectCell({
          idx: gridColumns.length - 1,
          rowIdx: selectedCellPosition?.rowIdx ?? 0,
        })
      },
      [`${metaKey}+c`]: (event) => {
        event.stopPropagation()
        if (selectedCellPosition) {
          const { idx, rowIdx } = selectedCellPosition
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
