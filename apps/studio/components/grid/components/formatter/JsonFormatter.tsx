import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import type { SupaRow } from '../../types'
import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'

export const JsonFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />

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
