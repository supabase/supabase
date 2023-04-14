import type { PostgresTable } from '@supabase/postgres-meta'
import { FC } from 'react'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import { ColumnPrivileges } from 'data/database/privileges-query'
import PrivilegesTable from './PrivilegesTable'

interface Props {
  privileges: Record<string, ColumnPrivileges[]>
  hasChanges: boolean
  table?: PostgresTable
  onChange: (table: string, columnName: string, privileges: string[]) => void
}

const PrivilegesBody: FC<Props> = (props) => {
  const { table } = props

  const handleToggle = (tableName: string, column: ColumnPrivileges, action: string) => {
    props.onChange(
      tableName,
      column.name,
      column.privileges.includes(action)
        ? column.privileges.filter((p) => p !== action)
        : [...column.privileges, action]
    )
  }

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
        columns={props.privileges[table.name]}
        onToggle={(column, action) => handleToggle(table.name, column, action)}
      />
    </section>
  )
}

export default PrivilegesBody
