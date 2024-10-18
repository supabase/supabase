import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'
import type { SupaRow } from '../../types'
import { NullValue } from '../common/NullValue'

export const BooleanFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const value = p.row[p.column.key] as boolean | null
  if (value === null) return <NullValue />
  return <>{value ? 'TRUE' : 'FALSE'}</>
}
