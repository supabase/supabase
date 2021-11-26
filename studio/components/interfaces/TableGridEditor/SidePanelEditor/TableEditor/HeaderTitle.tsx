import { PostgresTable } from '@supabase/postgres-meta'
import { Typography } from '@supabase/ui'

interface Props {
  table: PostgresTable
  isDuplicating: boolean
}

const HeaderTitle: React.FC<Props> = ({ table, isDuplicating }) => {
  if (!table) {
    return <>Create a new table</>
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
