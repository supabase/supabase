import * as React from 'react'
import type { RenderCellProps } from 'react-data-grid'
import type { SupaRow } from '../../types'
import { EmptyValue, NullValue } from '../common'

export const JsonFormatter = (p: React.PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  try {
    value = JSON.stringify(value)
  } catch (err) {}

  return <>{value}</>
}
