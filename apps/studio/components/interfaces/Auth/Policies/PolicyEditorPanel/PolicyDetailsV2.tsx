import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  RadioGroup,
  RadioGroupLargeItem,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
} from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface PolicyDetailsV2Props {
  schema: string
  searchString?: string
  selectedTable?: string
  isEditing: boolean
  form: UseFormReturn<{
    name: string
    table: string
    behavior: string
    command: string
    roles: string
  }>
  onUpdateCommand: (command: string) => void
  authContext: 'database' | 'realtime'
}

export const PolicyDetailsV2 = ({
  schema,
  searchString,
  selectedTable,
  isEditing,
  form,
  onUpdateCommand,
  authContext,
}: PolicyDetailsV2Props) => {
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)
  const { can: canUpdatePolicies } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { data: tables, isSuccess: isSuccessTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: schema,
    sortByProperty: 'name',
    includeColumns: true,
  })

  const { data: dbRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const formattedRoles = (dbRoles ?? [])
    .map((role) => {
      return {
        id: role.id,
        name: role.name,
        value: role.name,
        disabled: false,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    if (!isEditing && selectedTable === undefined) {
      const table = tables?.find(
        (table) =>
          table.schema === schema &&
          (table.id.toString() === searchString || table.name === searchString)
      )
      if (table) {
        form.setValue('table', table.name)
      } else if (isSuccessTables && tables.length > 0) {
        form.setValue('table', tables[0].name)
      }
    }
  }, [isEditing, form, searchString, tables, isSuccessTables, selectedTable])

  return (
    <>
      <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
        <div className="items-start justify-between gap-4 grid grid-cols-12">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-6 flex flex-col gap-y-1">
                <FormLabel>Policy Name</FormLabel>
                <FormControl>
                  <Input_Shadcn_
                    {...field}
                    disabled={!canUpdatePolicies}
                    className="bg-control border-control"
                    placeholder="Provide a name for your policy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="table"
            render={({ field }) => (
              <FormItem className="col-span-6 flex flex-col gap-y-1">
                <FormLabel>
                  Table
                  <code className="text-code-inline">on</code> clause
                </FormLabel>
                {authContext === 'database' && (
                  <FormControl>
                    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
                      <PopoverTrigger_Shadcn_ asChild>
                        <Button
                          type="default"
                          disabled={!canUpdatePolicies}
                          className="w-full [&>span]:w-full h-[38px] text-sm"
                          iconRight={
                            <ChevronsUpDown
                              className="text-foreground-muted"
                              strokeWidth={2}
                              size={14}
                            />
                          }
                        >
                          <div className="w-full flex gap-1">
                            <span className="text-foreground">
                              {schema}.{field.value}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger_Shadcn_>

                      <PopoverContent_Shadcn_
                        className="p-0"
                        side="bottom"
                        align="start"
                        sameWidthAsTrigger
                      >
                        <Command_Shadcn_>
                          <CommandInput_Shadcn_ placeholder="Find a table..." />
                          <CommandList_Shadcn_ onWheel={(event) => event.stopPropagation()}>
                            <CommandEmpty_Shadcn_>No tables found</CommandEmpty_Shadcn_>
                            <CommandGroup_Shadcn_>
                              <ScrollArea className={(tables ?? []).length > 7 ? 'h-[200px]' : ''}>
                                {(tables ?? []).map((table) => (
                                  <CommandItem_Shadcn_
                                    key={table.id}
                                    className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                                    onSelect={() => {
                                      form.setValue('table', table.name)
                                      setOpen(false)
                                    }}
                                    onClick={() => {
                                      form.setValue('table', table.name)
                                      setOpen(false)
                                    }}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {field.value === table.name ? <Check size={13} /> : ''}
                                      {table.name}
                                    </span>
                                  </CommandItem_Shadcn_>
                                ))}
                              </ScrollArea>
                            </CommandGroup_Shadcn_>
                          </CommandList_Shadcn_>
                        </Command_Shadcn_>
                      </PopoverContent_Shadcn_>
                    </Popover_Shadcn_>
                  </FormControl>
                )}
                {authContext === 'realtime' && (
                  <FormControl>
                    <Input_Shadcn_
                      disabled
                      value="messages.realtime"
                      className="bg-control border-control"
                    />
                  </FormControl>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="behavior"
            render={({ field }) => (
              <FormItem className="col-span-6 flex flex-col gap-y-1">
                <FormLabel>
                  Policy Behavior <code className="text-code-inline">as</code> clause
                </FormLabel>
                <FormControl>
                  <Select_Shadcn_
                    disabled={isEditing}
                    value={field.value}
                    onValueChange={(value) => form.setValue('behavior', value)}
                  >
                    <SelectTrigger_Shadcn_ className="text-sm h-10 capitalize">
                      {field.value}
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="permissive" className="text-sm">
                          <p>Permissive</p>
                          <p className="text-foreground-light text-xs">
                            Policies are combined using the "OR" Boolean operator
                          </p>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="restrictive" className="text-sm">
                          <p>Restrictive</p>
                          <p className="text-foreground-light text-xs">
                            Policies are combined using the "AND" Boolean operator
                          </p>
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="command"
            render={({ field }) => (
              <FormItem className="col-span-12 flex flex-col gap-y-1">
                <FormLabel>
                  Policy Command <code className="text-code-inline">for</code> clause
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    disabled={isEditing}
                    value={field.value}
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      form.setValue('command', value)
                      onUpdateCommand(value)
                    }}
                    className={cn('flex flex-wrap gap-3', isEditing && 'opacity-50')}
                  >
                    {[
                      'select',
                      'insert',
                      ...(authContext === 'database' ? ['update', 'delete', 'all'] : []),
                    ].map((x) => (
                      <RadioGroupLargeItem
                        key={x}
                        value={x}
                        disabled={isEditing}
                        label={x.toLocaleUpperCase()}
                        className={cn('w-auto', isEditing && 'cursor-not-allowed')}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem className="col-span-12 flex flex-col gap-y-1">
                <FormLabel htmlFor="roles">
                  Target Roles <code className="text-code-inline">to</code> clause
                </FormLabel>
                <FormControl>
                  <MultiSelector
                    onValuesChange={(roles) => field.onChange(roles.join(', '))}
                    disabled={!canUpdatePolicies}
                    values={field.value.length === 0 ? [] : field.value?.split(', ')}
                    size="small"
                  >
                    <MultiSelectorTrigger
                      id="roles"
                      mode="inline-combobox"
                      label={
                        field.value.length === 0
                          ? 'Defaults to all (public) roles if none selected'
                          : 'Search for a role'
                      }
                      badgeLimit="wrap"
                      showIcon={false}
                      deletableBadge
                      className="w-full"
                    />
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {formattedRoles.map((role) => (
                          <MultiSelectorItem
                            key={role.id}
                            value={role.value}
                            disabled={role.disabled}
                          >
                            {role.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}
