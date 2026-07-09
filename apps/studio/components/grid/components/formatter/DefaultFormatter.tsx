import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { isColumnMasked } from '../../utils/sensitive-data'
import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'
import { SupaRow } from '@/components/grid/types'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const DefaultFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  let value = p.row[p.column.key]

  // Check if column should be masked: marked sensitive AND not temporarily revealed
  const isMasked = isColumnMasked(
    p.column.key as string,
    snap.sensitiveDataColumns,
    snap.temporarilyRevealedColumns
  )

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (isMasked) return <>••••••••</>
  if (typeof value == 'object' || Array.isArray(value)) {
    value = JSON.stringify(value)
  }
  return <>{value}</>
}
