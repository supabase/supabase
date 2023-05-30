import * as React from 'react'
import { FormatterProps } from '@supabase/react-data-grid'
import { SupaRow } from '../../types'
import { EmptyValue, NullValue } from '../common'

export const JsonFormatter = (p: React.PropsWithChildren<FormatterProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  try {
    value = JSON.stringify(value)
  } catch (err) {}

  return <>{value}</>
}
