import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { isColumnMasked } from '../../utils/sensitive-data'
import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'
import { formatTimestamptzDisplay } from './TimestampFormatter.utils'
import type { SupaRow } from '@/components/grid/types'
import { useTimezone } from '@/lib/datetime'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const TimestampFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  const { timezone } = useTimezone()
  const value = p.row[p.column.key]
  const isMasked = isColumnMasked(
    p.column.key as string,
    snap.sensitiveDataColumns,
    snap.temporarilyRevealedColumns
  )

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (isMasked) return <>••••••••</>

  const display = formatTimestamptzDisplay(value, timezone)
  const original =
    typeof value === 'string' || typeof value === 'number' ? String(value) : undefined

  return <span title={original}>{display}</span>
}
