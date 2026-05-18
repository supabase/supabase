import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'

import SchemaSelector from '@/components/ui/SchemaSelector'

export interface PrivilegesHeadProps {
  disabled: boolean
  selectedSchema: string
  selectedRole: string
  selectedTable?: { name: string }
  tables: string[]
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
  disabled,
  selectedSchema,
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-2">
        <SchemaSelector
          className="bg-control rounded-md w-[180px] [&>button]:py-[5px]"
          selectedSchemaName={selectedSchema}
          onSelectSchema={onChangeSchema}
        />
        <TablesSelect selectedTable={selectedTable} tables={tables} onChangeTable={onChangeTable} />
        <div className="h-[20px] w-px border-r border-scale-600"></div>
        <RolesSelect selectedRole={selectedRole} roles={roles} onChangeRole={onChangeRole} />
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
          disabled={disabled || !hasChanges || isApplyingChanges}
          loading={isApplyingChanges}
        >
          Apply Changes
        </Button>
      </div>
    </div>
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
    <Select value={selectedRole} onValueChange={onChangeRole}>
      <SelectTrigger size="tiny" className="w-40">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {roles.map((role) => (
            <SelectItem key={role} value={role} className="text-xs">
              <span className="text-foreground-light mr-1">role</span> {role}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const TablesSelect = ({
  selectedTable,
  tables,
  onChangeTable,
}: {
  selectedTable?: {
    name: string
  }
  tables: string[]
  onChangeTable: (table: string) => void
}) => {
  return (
    <Select value={selectedTable?.name} onValueChange={onChangeTable}>
      <SelectTrigger size="tiny" className="w-44">
        <SelectValue placeholder="Select a table" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {tables.length === 0 ? (
            <div className="text-xs text-foreground-light p-2">
              No tables available in this schema
            </div>
          ) : null}
          {tables.map((table) => (
            <SelectItem key={table} value={table} className="text-xs">
              <span className="text-foreground-light mr-1">table</span> {table}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default PrivilegesHead
