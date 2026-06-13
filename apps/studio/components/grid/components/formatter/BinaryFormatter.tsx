import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { NullValue } from '../common/NullValue'
import { SupaRow } from '@/components/grid/types'
import { convertByteaToHex } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const BinaryFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  const value = p.row[p.column.key]
  const isMasked =
    snap.sensitiveDataColumns.has(p.column.key as string) &&
    !snap.temporarilyRevealedColumns.has(p.column.key as string)

  if (!value) return <NullValue />
  if (isMasked) return <>••••••••</>
  const binaryValue = convertByteaToHex(value)
  return <>{binaryValue}</>
}
