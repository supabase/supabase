import { PropsWithChildren } from 'react'
import { RenderCellProps } from 'react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'

export const BooleanFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const value = p.row[p.column.key] as boolean | null
  if (value === null) return <NullValue />
  return <>{value ? 'TRUE' : 'FALSE'}</>
}
