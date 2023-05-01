import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { PrivilegeColumnUI } from './Privileges.types'
import PrivilegesBody from './PrivilegesBody'
import PrivilegesFooter from './PrivilegesFooter'
import PrivilegesHead from './PrivilegesHead'

interface Props {
  tables: string[]
  columns: PrivilegeColumnUI[]
  selectedSchema: string
  selectedRole: string
  availableSchemas: string[]
  openSchemas: PostgresSchema[]
  protectedSchemas: PostgresSchema[]
  roles: string[]
  isSchemaLocked: boolean
  hasChanges: boolean
  selectedTable?: PostgresTable
  onChangeSchema: (schema: string) => void
  onChangeRole: (role: string) => void
  onChangeTable: (table: string) => void
  onChangePrivileges: (table: string, columnName: string, privileges: string[]) => void
  onReset: () => void
  onClickSave: () => void
}

function Privileges(props: Props) {
  return (
    <>
      <div className="flex flex-col h-full">
        <PrivilegesHead
          selectedSchema={props.selectedSchema}
          selectedRole={props.selectedRole}
          selectedTable={props.selectedTable}
          tables={props.tables}
          availableSchemas={props.availableSchemas}
          openSchemas={props.openSchemas}
          protectedSchemas={props.protectedSchemas}
          roles={props.roles}
          isSchemaLocked={props.isSchemaLocked}
          onChangeSchema={props.onChangeSchema}
          onChangeRole={props.onChangeRole}
          onChangeTable={props.onChangeTable}
        />
        <PrivilegesBody
          columns={props.columns}
          table={props.selectedTable}
          hasChanges={props.hasChanges}
          onChange={props.onChangePrivileges}
        />
        <PrivilegesFooter
          hasChanges={props.hasChanges}
          onReset={props.onReset}
          onClickSave={props.onClickSave}
        />
      </div>
    </>
  )
}

export default Privileges
