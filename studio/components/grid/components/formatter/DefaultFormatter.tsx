import * as React from 'react'
import { RenderCellProps } from 'react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'
import { EmptyValue } from '../common/EmptyValue'

export const DefaultFormatter = (p: React.PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]
  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (typeof value == 'object' || Array.isArray(value)) {
    value = JSON.stringify(value)
  }
  return <>{value}</>
}
