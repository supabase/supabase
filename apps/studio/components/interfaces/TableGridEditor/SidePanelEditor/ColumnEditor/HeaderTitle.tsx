import type { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

interface Props {
  table: PostgresTable
  column: PostgresColumn
}

// Need to fix for new column later
const HeaderTitle: React.FC<Props> = ({ table, column }) => {
  if (!column) {
    return (
      <>
        Add new column to <code>{table.name}</code>
      </>
    )
  }
  return (
    <>
      Update column <code>{column.name}</code> from <code>{column.table}</code>
    </>
  )
}

export default HeaderTitle
