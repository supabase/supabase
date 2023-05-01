import type { PostgresTable } from '@supabase/postgres-meta'
import { FC } from 'react'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import { PrivilegeColumnUI } from './Privileges.types'
import PrivilegesTable from './PrivilegesTable'

interface Props {
  columns: PrivilegeColumnUI[]
  hasChanges: boolean
  table?: PostgresTable
  onChange: (table: string, columnName: string, privileges: string[]) => void
}

const PrivilegesBody: FC<Props> = (props) => {
  const { table } = props

  const handleToggle = (tableName: string, column: PrivilegeColumnUI, privileges: string[]) => {
    props.onChange(
      tableName,
      column.name,
      column.privileges.some((p) => privileges.includes(p))
        ? column.privileges.filter((p) => !privileges.includes(p))
        : [...new Set([...column.privileges, ...privileges])]
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
        columns={props.columns}
        onToggle={(column, privileges) => handleToggle(table.name, column, privileges)}
      />
    </section>
  )
}

export default PrivilegesBody
