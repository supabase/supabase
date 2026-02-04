import {
  UseFormSetValue,
  UseFormWatch,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandInput_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  WarningIcon,
  Checkbox_Shadcn_,
  ScrollArea,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus, Key, X, RotateCcw } from 'lucide-react'
import { ACCESS_TOKEN_PERMISSIONS } from '../../AccessToken.constants'

export interface PermissionResource {
  resource: string
  title: string
  actions: string[]
}

export interface PermissionRow {
  resource: string
  action: string
}

export interface PermissionsFormValues extends FieldValues {
  permissionRows?: PermissionRow[]
}

interface PermissionsProps<TFormValues extends PermissionsFormValues = PermissionsFormValues> {
  setValue: UseFormSetValue<TFormValues>
  watch: UseFormWatch<TFormValues>
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
}

const createAllResources = (permissionGroup: { name: string; resources: PermissionResource[] }): PermissionResource[] => {
  return permissionGroup.resources.map((resource) => ({
    resource: resource.resource,
    title: resource.title,
    actions: resource.actions,
  }))
}

interface PermissionResourceSelectorProps<TFormValues extends PermissionsFormValues> {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissionRows: PermissionRow[]
  setValue: UseFormSetValue<TFormValues>
  allResources: PermissionResource[]
  align?: 'center' | 'end' | 'start'
}

const getBestAction = (actions: string[]): string => {
  const availableActions = actions.filter((a) => a !== 'no access')
  if (availableActions.length === 0) return 'no access'

  // Priority order: read-write > write > read > create > delete > others
  const priority = ['read-write', 'write', 'read', 'create', 'delete']
  for (const priorityAction of priority) {
    if (availableActions.includes(priorityAction)) {
      return priorityAction
    }
  }

  return availableActions[0]
}

const sortActions = (actions: string[]): string[] => {
  const sorted = [...actions]
  const noAccessIndex = sorted.indexOf('no access')
  if (noAccessIndex !== -1) {
    sorted.splice(noAccessIndex, 1)
    sorted.push('no access')
  }
  return sorted
}

const PermissionResourceSelector = <TFormValues extends PermissionsFormValues>({
  open,
  onOpenChange,
  permissionRows,
  setValue,
  align = 'center',
}: PermissionResourceSelectorProps<TFormValues>) => {
  const handleToggleResource = (resource: PermissionResource) => {
    const isAlreadyAdded = permissionRows.some((row) => row.resource === resource.resource)

    if (isAlreadyAdded) {
      const newRows = permissionRows.filter((row) => row.resource !== resource.resource)
      setValue(
        'permissionRows' as Path<TFormValues>,
        newRows as PathValue<TFormValues, Path<TFormValues>>
      )
    } else {
      const defaultAction = getBestAction(resource.actions)
      const newRows: PermissionRow[] = [
        ...permissionRows,
        { resource: resource.resource, action: defaultAction },
      ]
      setValue(
        'permissionRows' as Path<TFormValues>,
        newRows as PathValue<TFormValues, Path<TFormValues>>
      )
    }
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" size="tiny" icon={<Plus className="h-4 w-4" />}>
          Add permission
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[400px] p-0" align={align}>
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search resources..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

            <ScrollArea className="max-h-[200px] overflow-y-scroll">
              <CommandGroup_Shadcn_ className="[&>div]:text-left">
                {ACCESS_TOKEN_PERMISSIONS.resources.map((resource) => {
                  const isChecked = permissionRows.some(
                    (row) => row.resource === resource.resource
                  )
                  return (
                    <CommandItem_Shadcn_
                      key={resource.resource}
                      value={`${resource.resource} ${resource.title}`}
                      onSelect={() => handleToggleResource(resource)}
                      className="text-white"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Checkbox_Shadcn_
                          checked={isChecked}
                          onCheckedChange={() => handleToggleResource(resource)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Key size={12} className="text-foreground-lighter" />
                        <div className="flex flex-col text-left flex-1">
                          <span className="font-medium text-foreground">{resource.title}</span>
                        </div>
                      </div>
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </ScrollArea>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export const Permissions = <TFormValues extends PermissionsFormValues = PermissionsFormValues>({
  setValue,
  watch,
  resourceSearchOpen,
  setResourceSearchOpen,
}: PermissionsProps<TFormValues>) => {
  const permissionRows = (watch('permissionRows' as Path<TFormValues>) || []) as PermissionRow[]
  const ALL_RESOURCES = createAllResources(ACCESS_TOKEN_PERMISSIONS)

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Configure permissions</span>
          <div className="flex items-center gap-2">
            {permissionRows.length > 0 && (
              <ButtonTooltip
                type="default"
                size="tiny"
                className="p-1"
                onClick={() => {
                  setValue(
                    'permissionRows' as Path<TFormValues>,
                    [] as PathValue<TFormValues, Path<TFormValues>>
                  )
                }}
                icon={<RotateCcw size={16} />}
                tooltip={{
                  content: {
                    side: 'top',
                    align: 'center',
                    alignOffset: -10,
                    text: 'Reset all permissions',
                  },
                }}
              />
            )}
            <PermissionResourceSelector
              open={resourceSearchOpen}
              onOpenChange={setResourceSearchOpen}
              permissionRows={permissionRows}
              setValue={setValue}
              allResources={ALL_RESOURCES}
              align="end"
            />

          </div>
        </div>

        {permissionRows.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-sm text-foreground-light">No permissions configured yet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg">
            {permissionRows.map((row, index) => {
              const selectedResource = ALL_RESOURCES.find((r) => r.resource === row.resource)
              return (
                <div key={index}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[36ch]">
                            {selectedResource?.title}
                          </span>
                          {/* Removed group display */}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedResource && (
                        <Select_Shadcn_
                          value={row.action}
                          onValueChange={(value) => {
                            const newRows: PermissionRow[] = permissionRows.map((r, i) =>
                              i === index ? { resource: r.resource, action: value } : r
                            )
                            setValue(
                              'permissionRows' as Path<TFormValues>,
                              newRows as PathValue<TFormValues, Path<TFormValues>>,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            )
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="w-[150px] h-7">
                            <SelectValue_Shadcn_ placeholder="Set access" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {sortActions(selectedResource.actions).map((action) => (
                              <SelectItem_Shadcn_ key={action} value={action}>
                                {action === 'no access'
                                  ? 'No access'
                                  : action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, ' ')}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      )}
                      <Button
                        type="text"
                        size="tiny"
                        className="p-1"
                        onClick={() => {
                          const newRows = permissionRows.filter((_, i) => i !== index)
                          setValue(
                            'permissionRows' as Path<TFormValues>,
                            newRows as PathValue<TFormValues, Path<TFormValues>>
                          )
                        }}
                        icon={<X size={16} />}
                      />
                    </div>
                  </div>
                  {index < permissionRows.length - 1 && <div className="border-t border-border" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="w-full flex gap-x-2 items-center">
        <WarningIcon />
        <span className="text-xs text-left text-foreground-lighter">
          Once you've set these permissions, you cannot edit them.
        </span>
      </div>
    </div>
  )
}