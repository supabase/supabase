import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

import type { DeepReadonly } from '@/lib/type-helpers'

interface Props {
  table: PostgresTable
  column?: DeepReadonly<PostgresColumn>
}

export const HeaderTitle = ({ table, column }: Props) => {
  if (!column) {
    return (
      <>
        <span>Add new column to</span>
        <code className="text-code-inline text-sm! ml-1">{table.name}</code>
      </>
    )
  }
  return (
    <>
      Update column <code className="text-code-inline text-sm!">{column.name}</code> from{' '}
      <code className="text-code-inline text-sm!">{column.table}</code>
    </>
  )
}
