import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { PrivilegeColumnUI } from './Privileges.types'
import PrivilegesBody from './PrivilegesBody'
import PrivilegesHead from './PrivilegesHead'

export interface PrivilegesProps {
  tables: string[]
  columns: PrivilegeColumnUI[]
  selectedSchema: string
  selectedRole: string
  availableSchemas: string[]
  openSchemas: PostgresSchema[]
  protectedSchemas: PostgresSchema[]
  roles: string[]
  isSchemaLocked: boolean
  selectedTable?: PostgresTable
  onChangeSchema: (schema: string) => void
  onChangeRole: (role: string) => void
  onChangeTable: (table: string) => void
}

const Privileges = ({
  selectedSchema,
  selectedRole,
  selectedTable,
  tables,
  availableSchemas,
  openSchemas,
  protectedSchemas,
  roles,
  isSchemaLocked,
  columns,
  onChangeSchema,
  onChangeRole,
  onChangeTable,
}: PrivilegesProps) => {
  return (
    <>
      <div className="flex flex-col h-full">
        <PrivilegesHead
          selectedSchema={selectedSchema}
          selectedRole={selectedRole}
          selectedTable={selectedTable}
          tables={tables}
          availableSchemas={availableSchemas}
          openSchemas={openSchemas}
          protectedSchemas={protectedSchemas}
          roles={roles}
          isSchemaLocked={isSchemaLocked}
          onChangeSchema={onChangeSchema}
          onChangeRole={onChangeRole}
          onChangeTable={onChangeTable}
        />
        <PrivilegesBody
          columns={columns}
          table={selectedTable}
          // onChange={onChangePrivileges}
        />
      </div>
    </>
  )
}

export default Privileges
