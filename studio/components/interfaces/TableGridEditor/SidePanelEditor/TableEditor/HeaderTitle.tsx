import { PostgresTable } from '@supabase/postgres-meta'
import { Typography } from '@supabase/ui'

interface Props {
  schema: string
  table: PostgresTable
  isDuplicating: boolean
}

const HeaderTitle: React.FC<Props> = ({ schema, table, isDuplicating }) => {
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
        Duplicate table <Typography.Text code>{table.name}</Typography.Text>
      </>
    )
  }
  return (
    <>
      Update table <Typography.Text code>{table.name}</Typography.Text>
    </>
  )
}

export default HeaderTitle
