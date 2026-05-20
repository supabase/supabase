import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'
import { SupaRow } from '@/components/grid/types'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const DefaultFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  let value = p.row[p.column.key]

  // Check if this column has sensitive data masking enabled
  const isMasked = snap.sensitiveDataColumns.has(p.column.key as string)

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (isMasked) return <>••••••••</>
  if (typeof value == 'object' || Array.isArray(value)) {
    value = JSON.stringify(value)
  }
  return <>{value}</>
}
