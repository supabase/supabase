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
        Create a new table under <code className="text-sm">{schema}</code>
      </>
    )
  }
  if (isDuplicating) {
    return (
      <>
        Duplicate table <code className="text-sm">{table.name}</code>
      </>
    )
  }
  return (
    <>
      Update table <code className="text-sm">{table.name}</code>
    </>
  )
}

export default HeaderTitle
