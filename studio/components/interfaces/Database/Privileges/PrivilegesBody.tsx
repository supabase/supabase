import type { PostgresTable } from '@supabase/postgres-meta'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import { PrivilegeColumnUI, TablePrivilegesUI } from './Privileges.types'
import PrivilegesTable from './PrivilegesTable'

export interface PrivilegesBodyProps {
  tablePrivileges: TablePrivilegesUI[]
  columns: PrivilegeColumnUI[]
  table?: PostgresTable
  role: string
}

const PrivilegesBody = ({ tablePrivileges, table, columns, role }: PrivilegesBodyProps) => {
  if (table === undefined) return <NoSearchResults />

  return (
    <section>
      <div className="sticky top-0 backdrop-blur backdrop-filter">
        <div className="flex items-baseline space-x-1 py-2">
          <h5 className="text-scale-1000">table</h5>
          <h4>{table.name}</h4>
        </div>
      </div>
      <PrivilegesTable
        tableId={table.id}
        tablePrivileges={tablePrivileges}
        columns={columns}
        role={role}
      />
    </section>
  )
}

export default PrivilegesBody
