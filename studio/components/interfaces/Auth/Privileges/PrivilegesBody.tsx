import type { PostgresTable } from '@supabase/postgres-meta'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import { PrivilegeColumnUI } from './Privileges.types'
import PrivilegesTable from './PrivilegesTable'

export interface PrivilegesBodyProps {
  columns: PrivilegeColumnUI[]
  table?: PostgresTable
}

const PrivilegesBody = ({ table, columns }: PrivilegesBodyProps) => {
  // const handleToggle = (tableName: string, column: PrivilegeColumnUI, privileges: string[]) => {
  //   onChange(
  //     tableName,
  //     column.name,
  // column.privileges.some((p) => privileges.includes(p))
  //   ? column.privileges.filter((p) => !privileges.includes(p))
  //   : [...new Set([...column.privileges, ...privileges])]
  //   )
  // }

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
        columns={columns}
        // onToggle={(column, privileges) => handleToggle(table.name, column, privileges)}
      />
    </section>
  )
}

export default PrivilegesBody
