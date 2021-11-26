import { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'
import { Typography } from '@supabase/ui'

interface Props {
  table: PostgresTable
  column: PostgresColumn
}

// Need to fix for new column later
const HeaderTitle: React.FC<Props> = ({ table, column }) => {
  if (!column) {
    return (
      <>
        Add new column to <Typography.Text code>{table.name}</Typography.Text>
      </>
    )
  }
  return (
    <>
      Update column <Typography.Text code>{column.name}</Typography.Text> from{' '}
      <Typography.Text code>{column.table}</Typography.Text>
    </>
  )
}

export default HeaderTitle
