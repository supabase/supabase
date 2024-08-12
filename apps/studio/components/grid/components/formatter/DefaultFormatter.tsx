import * as React from 'react'
import type { RenderCellProps } from 'react-data-grid'
import type { SupaRow } from '../../types'
import { EmptyValue } from '../common/EmptyValue'
import { NullValue } from '../common/NullValue'
import Image from 'next/image'

export const DefaultFormatter = (p: React.PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]
  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />
  if (typeof value == 'object' || Array.isArray(value)) {
    value = JSON.stringify(value)
  }
  // add a new condition here to check for items that look like this
  // https://izrhmrwznyaxokvpqxuk.supabase.red/storage/v1/object/public/test/screenshot-2024-08-09-at-15.47.41.png?t=2024-08-09T18%3A35%3A17.400Z
  // and return a <Image /> component
  if (typeof value === 'string' && value.includes('/storage/v1/object')) {
    return (
      <div className="w-10 h-10 p-1 overflow-hidden">
        <Image src={value} alt="image" fill={true} />
      </div>
    )
  }

  return <>{value}</>
}
