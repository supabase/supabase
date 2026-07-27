import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import type { SupaRow } from '../../types'
import { isColumnMasked } from '../../utils/sensitive-data'
import { NullValue } from '../common/NullValue'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const BooleanFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  const value = p.row[p.column.key] as boolean | null
  const isMasked = isColumnMasked(
    p.column.key as string,
    snap.sensitiveDataColumns,
    snap.temporarilyRevealedColumns
  )

  if (value === null) return <NullValue />
  if (isMasked) return <>••••••••</>
  return <>{value ? 'TRUE' : 'FALSE'}</>
}
