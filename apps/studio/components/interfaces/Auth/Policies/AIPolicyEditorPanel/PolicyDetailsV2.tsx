import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useEffect, useRef, useState } from 'react'
import {
  IconLock,
  Input,
  Input_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  RadioGroup_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  cn,
} from 'ui'
import RLSCodeEditor from './RLSCodeEditor'
import { useTablesQuery } from 'data/tables/tables-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import MultiSelect from 'ui-patterns/MultiSelect'
import { CodeEditor } from 'components/ui/CodeEditor'

// [Joshen] Just for demo, will use proper form components later and proper loading states

interface PolicyDetailsV2Props {
  field: { name: string; table: string; behaviour: string; command: string; roles: string[] }
  onUpdateField: (
    value: string | string[],
    field: 'name' | 'table' | 'behaviour' | 'command' | 'roles'
  ) => void
}

export const PolicyDetailsV2 = ({ field, onUpdateField }: PolicyDetailsV2Props) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const { name, table, behaviour, command, roles } = field

  const { data: tables, isSuccess: isSuccessTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.selectedSchemaName,
    sortByProperty: 'name',
    includeColumns: true,
  })

  const { data: dbRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const formattedRoles = (dbRoles ?? []).map((role) => {
    return {
      id: role.id,
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  const supportUsing = ['SELECT', 'UPDATE', 'DELETE', 'ALL'].includes(command)
  const supportWithCheck = ['INSERT', 'UPDATE', 'ALL'].includes(command)

  useEffect(() => {
    if (isSuccessTables && tables.length > 0) onUpdateField(tables[0].name, 'table')
  }, [isSuccessTables, tables])

  return (
    <>
      <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
        <div className="flex items-center justify-between gap-4 grid grid-cols-12">
          <div className="col-span-6 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Policy Name</p>
            <Input_Shadcn_
              value={name}
              className="bg-control border-control"
              onChange={(event) => onUpdateField(event.target.value, 'name')}
            />
          </div>

          <div className="col-span-6 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Table</p>
            <Select_Shadcn_ value={table} onValueChange={(value) => onUpdateField(value, 'table')}>
              <SelectTrigger_Shadcn_ className="text-sm h-10">
                {snap.selectedSchemaName}.{table}
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  {(tables ?? []).map((table) => (
                    <SelectItem_Shadcn_ key={table.id} value={table.name} className="text-sm">
                      {table.name}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>

          <div className="col-span-6 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Policy Behaviour</p>
            <Select_Shadcn_
              value={behaviour}
              onValueChange={(value) => onUpdateField(value, 'behaviour')}
            >
              <SelectTrigger_Shadcn_ className="text-sm h-10">{behaviour}</SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  <SelectItem_Shadcn_ value="Permissive" className="text-sm">
                    Permissive
                  </SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="Restrictive" className="text-sm">
                    Restrictive
                  </SelectItem_Shadcn_>
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>

          <div className="col-span-12 flex flex-col gap-y-2">
            <label className="block text-foreground-light text-sm leading-4">Policy Command</label>
            <RadioGroup_Shadcn_
              value={command}
              defaultValue={command}
              onValueChange={(value) => onUpdateField(value, 'command')}
              aria-label="Choose a theme"
              className="grid grid-cols-10 gap-3"
            >
              <RadioGroupLargeItem_Shadcn_
                value="SELECT"
                label="SELECT"
                className="col-span-2 w-auto"
              />
              <RadioGroupLargeItem_Shadcn_
                value="INSERT"
                label="INSERT"
                className="col-span-2 w-auto"
              />
              <RadioGroupLargeItem_Shadcn_
                value="UPDATE"
                label="UPDATE"
                className="col-span-2 w-auto"
              />
              <RadioGroupLargeItem_Shadcn_
                value="DELETE"
                label="DELETE"
                className="col-span-2 w-auto"
              />
              <RadioGroupLargeItem_Shadcn_ value="ALL" label="ALL" className="col-span-2 w-auto" />
            </RadioGroup_Shadcn_>
          </div>

          <div className="col-span-12 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Target Roles</p>
            <MultiSelect
              options={formattedRoles}
              value={roles}
              placeholder="Defaults to all (public) roles if none selected"
              searchPlaceholder="Search for a role"
              onChange={(roles) => onUpdateField(roles, 'roles')}
            />
          </div>
        </div>
      </div>
    </>
  )
}
