import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { Listbox } from 'ui'

export interface PrivilegesHeadProps {
  selectedSchema: string
  selectedRole: string
  selectedTable?: PostgresTable
  tables: string[]
  schemas: PostgresSchema[]
  roles: string[]
  onChangeSchema: (schema: string) => void
  onChangeRole: (role: string) => void
  onChangeTable: (table: string) => void
}

const PrivilegesHead = ({
  selectedSchema,
  schemas,
  onChangeSchema,
  selectedRole,
  roles,
  onChangeRole,
  selectedTable,
  tables,
  onChangeTable,
}: PrivilegesHeadProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-[230px]">
            <SchemasListbox
              selectedSchema={selectedSchema}
              schemas={schemas}
              onChangeSchema={onChangeSchema}
            />
          </div>
          <div className="w-[230px]">
            <TablesListbox
              selectedTable={selectedTable}
              tables={tables}
              onChangeTable={onChangeTable}
            />
          </div>
          <div className="h-[20px] w-px border-r border-scale-600"></div>
          <div className="w-[230px]">
            <RolesListbox selectedRole={selectedRole} roles={roles} onChangeRole={onChangeRole} />
          </div>
        </div>
      </div>
    </div>
  )
}

const SchemasListbox = ({
  selectedSchema,
  schemas,
  onChangeSchema,
}: {
  selectedSchema: string
  schemas: PostgresSchema[]
  onChangeSchema: (schema: string) => void
}) => {
  return (
    <Listbox size="small" value={selectedSchema} onChange={onChangeSchema}>
      <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
        <p className="text-sm">Schemas</p>
      </Listbox.Option>
      {schemas.map((schema) => (
        <Listbox.Option
          key={schema.id}
          value={schema.name}
          label={schema.name}
          addOnBefore={() => <span className="text-scale-900">schema</span>}
        >
          <span className="text-scale-1200 text-sm">{schema.name}</span>
        </Listbox.Option>
      ))}
    </Listbox>
  )
}

const RolesListbox = ({
  selectedRole,
  roles,
  onChangeRole,
}: {
  selectedRole: string
  roles: string[]
  onChangeRole: (role: string) => void
}) => {
  return (
    <Listbox size="small" value={selectedRole} onChange={onChangeRole}>
      <Listbox.Option disabled key="normal-rols" value="normal-rols" label="Roles">
        <p className="text-sm">Roles</p>
      </Listbox.Option>
      {roles.map((role) => (
        <Listbox.Option
          key={role}
          value={role}
          label={role}
          addOnBefore={() => <span className="text-scale-900">role</span>}
        >
          <span className="text-scale-1200 text-sm">{role}</span>
        </Listbox.Option>
      ))}
    </Listbox>
  )
}

const TablesListbox = ({
  selectedTable,
  tables,
  onChangeTable,
}: {
  selectedTable?: PostgresTable
  tables: string[]
  onChangeTable: (table: string) => void
}) => {
  return (
    <Listbox size="small" value={selectedTable?.name} onChange={onChangeTable}>
      <Listbox.Option disabled key="normal-tables" value="normal-tables" label="Tables">
        <p className="text-sm">Tables</p>
      </Listbox.Option>
      {tables.map((table) => (
        <Listbox.Option
          key={table}
          value={table}
          label={table}
          addOnBefore={() => <span className="text-scale-900">table</span>}
        >
          <span className="text-scale-1200 text-sm">{table}</span>
        </Listbox.Option>
      ))}
    </Listbox>
  )
}

export default PrivilegesHead
