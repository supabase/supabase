import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { PrivilegeColumnUI, TablePrivilegesUI } from './Privileges.types'
import PrivilegesBody from './PrivilegesBody'
import PrivilegesHead from './PrivilegesHead'
import Link from 'next/link'
import { Button, IconExternalLink } from 'ui'

export interface PrivilegesProps {
  tables: string[]
  columns: PrivilegeColumnUI[]
  tablePrivileges: TablePrivilegesUI[]
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
  tablePrivileges,
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
    <div className="col-span-12">
      <div className="flex items-center justify-between mb-6 gap-12">
        <div>
          <h3 className="mb-1 text-xl">Column-level privileges</h3>

          <div className="text-sm text-lighter">
            <p>Grant or revoke privileges on a column based on user role.</p>
            <p>This is an advanced feature and should be used with caution.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://supabase.com/docs/guides/guides/auth/column-level-security"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
            </Link>
          </Button>
        </div>
      </div>
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
        tablePrivileges={tablePrivileges}
        columns={columns}
        table={selectedTable}
        role={selectedRole}
      />
      {selectedTable && (
        <p className="text-xs text-right text-light">
          <strong>Warning: </strong>
          Changing column privileges can break existing queries
        </p>
      )}
    </div>
  )
}

export default Privileges
