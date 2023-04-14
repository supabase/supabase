import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { IconLock, Listbox } from 'ui'

interface Props {
  selectedSchema: string
  selectedRole: string
  selectedTable?: PostgresTable
  tables: string[]
  availableSchemas: string[]
  openSchemas: PostgresSchema[]
  protectedSchemas: PostgresSchema[]
  roles: string[]
  isSchemaLocked: boolean
  onChangeSchema: (schema: string) => void
  onChangeRole: (role: string) => void
  onChangeTable: (table: string) => void
}

function PrivilegesHead(props: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-[230px]">
            <SchemasListbox
              selectedSchema={props.selectedSchema}
              availableSchemas={props.availableSchemas}
              openSchemas={props.openSchemas}
              protectedSchemas={props.protectedSchemas}
              isSchemaLocked={props.isSchemaLocked}
              onChangeSchema={props.onChangeSchema}
            />
          </div>
          <div className="w-[230px]">
            <RolesListbox
              selectedRole={props.selectedRole}
              roles={props.roles}
              onChangeRole={props.onChangeRole}
            />
          </div>
          <div className="w-[230px]">
            <TablesListbox
              selectedTable={props.selectedTable}
              tables={props.tables}
              onChangeTable={props.onChangeTable}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SchemasListbox(props: {
  selectedSchema: string
  availableSchemas: string[]
  openSchemas: PostgresSchema[]
  protectedSchemas: PostgresSchema[]
  isSchemaLocked: boolean
  onChangeSchema: (schema: string) => void
}) {
  return (
    <Listbox
      size="small"
      value={props.selectedSchema}
      onChange={props.onChangeSchema}
      icon={props.isSchemaLocked && <IconLock size={14} strokeWidth={2} />}
    >
      <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
        <p className="text-sm">Schemas</p>
      </Listbox.Option>
      {props.openSchemas
        .filter((schema) => props.availableSchemas.includes(schema.name))
        .map((schema) => (
          <Listbox.Option
            key={schema.id}
            value={schema.name}
            label={schema.name}
            addOnBefore={() => <span className="text-scale-900">schema</span>}
          >
            <span className="text-scale-1200 text-sm">{schema.name}</span>
          </Listbox.Option>
        ))}
      <Listbox.Option
        disabled
        key="protected-schemas"
        value="protected-schemas"
        label="Protected schemas"
      >
        <p className="text-sm">Protected schemas</p>
      </Listbox.Option>
      {props.protectedSchemas
        .filter((schema) => props.availableSchemas.includes(schema.name))
        .map((schema) => (
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

function RolesListbox(props: {
  selectedRole: string
  roles: string[]
  onChangeRole: (role: string) => void
}) {
  return (
    <Listbox size="small" value={props.selectedRole} onChange={props.onChangeRole}>
      <Listbox.Option disabled key="normal-rols" value="normal-rols" label="Roles">
        <p className="text-sm">Roles</p>
      </Listbox.Option>
      {props.roles.map((role) => (
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

function TablesListbox(props: {
  selectedTable?: PostgresTable
  tables: string[]
  onChangeTable: (table: string) => void
}) {
  return (
    <Listbox size="small" value={props.selectedTable?.name} onChange={props.onChangeTable}>
      <Listbox.Option disabled key="normal-tables" value="normal-tables" label="Tables">
        <p className="text-sm">Tables</p>
      </Listbox.Option>
      {props.tables.map((table) => (
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
