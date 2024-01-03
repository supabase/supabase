import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'

import {
  Button,
  Listbox,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'

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
  hasChanges?: boolean
  resetChanges: () => void
  applyChanges: () => void
  isApplyingChanges?: boolean
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
  hasChanges = false,
  resetChanges,
  applyChanges,
  isApplyingChanges = false,
}: PrivilegesHeadProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-[230px]">
            <SchemasSelect
              selectedSchema={selectedSchema}
              schemas={schemas}
              onChangeSchema={onChangeSchema}
            />
          </div>
          <div className="w-[230px]">
            <TablesSelect
              selectedTable={selectedTable}
              tables={tables}
              onChangeTable={onChangeTable}
            />
          </div>
          <div className="h-[20px] w-px border-r border-scale-600"></div>
          <div className="w-[230px]">
            <RolesSelect selectedRole={selectedRole} roles={roles} onChangeRole={onChangeRole} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="default"
            size="tiny"
            onClick={resetChanges}
            disabled={!hasChanges || isApplyingChanges}
          >
            Reset
          </Button>
          <Button
            type="primary"
            size="tiny"
            onClick={applyChanges}
            disabled={!hasChanges || isApplyingChanges}
            loading={isApplyingChanges}
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

const SchemasSelect = ({
  selectedSchema,
  schemas,
  onChangeSchema,
}: {
  selectedSchema: string
  schemas: PostgresSchema[]
  onChangeSchema: (schema: string) => void
}) => {
  return (
    <Select_Shadcn_ value={selectedSchema} onValueChange={onChangeSchema}>
      <SelectTrigger_Shadcn_>
        <SelectValue_Shadcn_ placeholder="Select a schema" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Schemas</SelectLabel_Shadcn_>

          {schemas.map((schema) => (
            <SelectItem_Shadcn_ key={schema.name} value={schema.name}>
              <span className="text-foreground-light">schema</span> {schema.name}
            </SelectItem_Shadcn_>
          ))}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}

const RolesSelect = ({
  selectedRole,
  roles,
  onChangeRole,
}: {
  selectedRole: string
  roles: string[]
  onChangeRole: (role: string) => void
}) => {
  return (
    <Select_Shadcn_ value={selectedRole} onValueChange={onChangeRole}>
      <SelectTrigger_Shadcn_>
        <SelectValue_Shadcn_ placeholder="Select a role" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Roles</SelectLabel_Shadcn_>

          {roles.map((role) => (
            <SelectItem_Shadcn_ key={role} value={role}>
              <span className="text-foreground-light">role</span> {role}
            </SelectItem_Shadcn_>
          ))}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}

const TablesSelect = ({
  selectedTable,
  tables,
  onChangeTable,
}: {
  selectedTable?: PostgresTable
  tables: string[]
  onChangeTable: (table: string) => void
}) => {
  return (
    <Select_Shadcn_ value={selectedTable?.name} onValueChange={onChangeTable}>
      <SelectTrigger_Shadcn_>
        <SelectValue_Shadcn_ placeholder="Select a table" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Tables</SelectLabel_Shadcn_>

          {tables.map((table) => (
            <SelectItem_Shadcn_ key={table} value={table}>
              <span className="text-foreground-light">table</span> {table}
            </SelectItem_Shadcn_>
          ))}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}

export default PrivilegesHead
