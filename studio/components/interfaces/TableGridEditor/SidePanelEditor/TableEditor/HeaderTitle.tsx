import { FC } from 'react'
import type { PostgresTable } from '@supabase/postgres-meta'

interface Props {
  schema: string
  table: PostgresTable
  isDuplicating: boolean
}

const HeaderTitle: FC<Props> = ({ schema, table, isDuplicating }) => {
  if (!table) {
    return (
      <>
        Create a new table under <code>{schema}</code>
      </>
    )
  }
  if (isDuplicating) {
    return (
      <>
        Duplicate table <code>{table.name}</code>
      </>
    )
  }
  return (
    <>
      Update table <code>{table.name}</code>
    </>
  )
}

export default HeaderTitle
