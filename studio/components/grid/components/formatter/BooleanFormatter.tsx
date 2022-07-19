import * as React from 'react'
import { FormatterProps } from '@supabase/react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'

export const BooleanFormatter = (p: React.PropsWithChildren<FormatterProps<SupaRow, unknown>>) => {
  const value = p.row[p.column.key] as boolean | null
  if (value === null) return <NullValue />
  return <>{value ? 'true' : 'false'}</>
}
