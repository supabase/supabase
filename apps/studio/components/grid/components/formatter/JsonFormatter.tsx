import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import type { SupaRow } from '../../types'
import { isColumnMasked } from '../../utils/sensitive-data'
import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const JsonFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const snap = useTableEditorTableStateSnapshot()
  let value = p.row[p.column.key]
  const isMasked = isColumnMasked(
    p.column.key as string,
    snap.sensitiveDataColumns,
    snap.temporarilyRevealedColumns
  )

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (isMasked) return <>••••••••</>

  // [Joshen] With reference to table-rows-query, we're only pulling max n characters on text/jsonb columns
  // If column value is longer, value will be concatenated with ..., and we just want to make sure the JSON
  // still renders seemingly like JSON in the grid
  const isTruncated = typeof value === 'string' && value.endsWith('...')
  if (isTruncated) return <>{value}</>

  try {
    const jsonValue = JSON.parse(value)
    return <>{JSON.stringify(jsonValue)}</>
  } catch (err) {
    return <>{JSON.stringify(value)}</>
  }
}
