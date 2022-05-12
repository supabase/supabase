import { FC } from 'react'
import { Badge, Button } from '@supabase/ui'
import { PostgresTable } from '@supabase/postgres-meta'

interface Props {
  table: PostgresTable
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: (table: PostgresTable) => void
}

const PolicyTableRowHeader: FC<Props> = ({
  table,
  onSelectToggleRLS = () => {},
  onSelectCreatePolicy = () => {},
}) => {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex space-x-4 text-left">
        <h4 className="m-0 text-lg">
          <span>{table.name}</span>
        </h4>
        <Badge color={table.rls_enabled ? 'green' : 'yellow'}>
          {table.rls_enabled ? 'RLS enabled' : 'RLS disabled'}
        </Badge>
      </div>
      <div className="flex-1">
        <div className="flex flex-row-reverse">
          <Button type="outline" className="ml-2" onClick={() => onSelectCreatePolicy(table)}>
            New Policy
          </Button>
          <Button type="default" onClick={() => onSelectToggleRLS(table)}>
            {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PolicyTableRowHeader
