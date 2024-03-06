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
import MultiSelect from 'components/ui/MultiSelect'
import { CodeEditor } from 'components/ui/CodeEditor'

// [Joshen] Just for demo, will use proper form components later and proper loading states

export const PolicyDetailsV2 = () => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [name, setName] = useState('')
  const [table, setTable] = useState('')
  const [behaviour, setBehaviour] = useState('Permissive')
  const [command, setCommand] = useState('SELECT')
  const [roles, setRoles] = useState<string[]>([])

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
    if (isSuccessTables && tables.length > 0) setTable(tables[0].name)
  }, [isSuccessTables, tables])

  return (
    <>
      <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
        <div className="flex items-center justify-between gap-4 grid grid-cols-12">
          <div className="col-span-6 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Policy Name</p>
            <Input_Shadcn_ value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="col-span-6 flex flex-col gap-y-1">
            <p className="text-foreground-light text-sm">Table</p>
            <Select_Shadcn_ value={table} onValueChange={(value) => setTable(value)}>
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
            <Select_Shadcn_ value={behaviour} onValueChange={(value) => setBehaviour(value)}>
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
              onValueChange={setCommand}
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
              onChange={setRoles}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-300 py-2">
        <div className="flex items-center gap-x-2 px-5">
          <IconLock size={14} className="text-foreground-light" />
          <p className="text-xs text-foreground-light font-mono uppercase">
            Use options above to edit
          </p>
        </div>

        <div className="py-1 flex flex-col">
          <div className="flex items-center">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              1
            </p>
            <p className="text-sm font-mono tracking-tight">
              <span className="text-blue-900">CREATE POLICY</span>{' '}
              <span className={cn(name.length === 0 ? 'text-foreground-light italic' : '')}>
                "{name.length === 0 ? 'policy name' : name}"{' '}
              </span>
              <span className="text-blue-900">ON</span> "{snap.selectedSchemaName}"."{table}"
            </p>
          </div>
          <div className="flex items-center">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              2
            </p>
            <p className="text-sm font-mono tracking-tight">
              <span className="text-blue-900">AS</span>{' '}
              <span className="uppercase">{behaviour}</span>
            </p>
          </div>
          <div className="flex items-center">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              3
            </p>
            <p className="text-sm font-mono tracking-tight">
              <span className="text-blue-900">FOR</span> {command}
            </p>
          </div>
          <div className="flex items-start">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              4
            </p>
            <p className="text-sm font-mono tracking-tight">
              <span className="text-blue-900">TO</span>{' '}
              {roles.length === 0 ? 'public' : roles.join(', ')}
            </p>
          </div>
          <div className="flex items-center">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              5
            </p>
            <p className="text-sm font-mono tracking-tight">
              <span className="text-blue-900">{supportUsing ? 'USING' : 'WITH CHECK'}</span> (
            </p>
          </div>
        </div>
      </div>

      <div className={`relative ${supportWithCheck && command !== 'INSERT' ? 'h-32' : 'h-full'}`}>
        <CodeEditor id={'using'} language={'pgsql'} />
      </div>

      <div className="bg-surface-300 py-2">
        <div className="py-1 flex flex-col">
          <div className="flex items-center">
            <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
              7
            </p>
            <p className="text-sm font-mono tracking-tight">
              )
              {supportWithCheck && command !== 'INSERT' ? (
                <>
                  {' '}
                  <span className="text-blue-900">WITH CHECK</span> (
                </>
              ) : (
                ';'
              )}
            </p>
          </div>
        </div>
      </div>

      {supportWithCheck && command !== 'INSERT' && (
        <>
          <div className={`relative h-32`}>
            <CodeEditor id={'with-check'} language={'pgsql'} />
          </div>
          <div className="bg-surface-300 py-2">
            <div className="py-1 flex flex-col">
              <div className="flex items-center">
                <p className="w-[57px] flex items-center justify-center text-sm font-mono text-foreground-light">
                  9
                </p>
                <p className="text-sm font-mono tracking-tight">);</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
