import { Control, UseFormSetValue, UseFormWatch, FieldValues, Path, PathValue } from 'react-hook-form'
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
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus, Key, X, RotateCcw } from 'lucide-react'
import { ACCESS_TOKEN_PERMISSIONS } from '../../AccessToken.constants'

export type AccessLevel = 'read' | 'read-write' | 'no access'

export interface PermissionResource {
  resource: string
  title: string
  actions: AccessLevel[]
}

interface PermissionGroup {
  name: string
  resources: PermissionResource[]
}

export interface PermissionRow {
  resource: string
  action: string
}

interface AllResource extends PermissionResource {
  group: string
}

export interface PermissionsFormValues extends FieldValues {
  permissionRows?: PermissionRow[]
}

interface PermissionsProps<TFormValues extends PermissionsFormValues = PermissionsFormValues> {
  control: Control<TFormValues>
  setValue: UseFormSetValue<TFormValues>
  watch: UseFormWatch<TFormValues>
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
}

const createAllResources = (permissionGroups: PermissionGroup[]): AllResource[] => {
  return permissionGroups.flatMap((group) =>
    group.resources.map((resource) => ({
      resource: resource.resource,
      title: resource.title,
      actions: resource.actions,
      group: group.name,
    }))
  )
}

interface PermissionResourceSelectorProps<TFormValues extends PermissionsFormValues> {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissionRows: PermissionRow[]
  setValue: UseFormSetValue<TFormValues>
  allResources: AllResource[]
  align?: 'center' | 'end' | 'start'
  presetLabelPrefix?: string
}

const PermissionResourceSelector = <TFormValues extends PermissionsFormValues>({
  open,
  onOpenChange,
  permissionRows,
  setValue,
  allResources,
  align = 'center',
  presetLabelPrefix = '',
}: PermissionResourceSelectorProps<TFormValues>) => {
  const handleSelectAll = () => {
    const allPermissions: PermissionRow[] = allResources.map((resource) => ({
      resource: resource.resource,
      action: resource.actions.includes('read-write')
        ? 'read-write'
        : resource.actions[0],
    }))
    setValue('permissionRows' as Path<TFormValues>, allPermissions as PathValue<TFormValues, Path<TFormValues>>)
    onOpenChange(false)
  }

  const handleSelectGroup = (groupName: string) => {
    const groupPermissions: PermissionRow[] = allResources
      .filter((resource) => resource.group === groupName)
      .map((resource) => ({
        resource: resource.resource,
        action: resource.actions.includes('read-write')
          ? 'read-write'
          : resource.actions[0],
      }))
    setValue('permissionRows' as Path<TFormValues>, groupPermissions as PathValue<TFormValues, Path<TFormValues>>)
    onOpenChange(false)
  }

  const handleSelectResource = (resource: PermissionResource) => {
    const defaultAction = resource.actions.includes('read-write')
      ? 'read-write'
      : resource.actions[0]
    const newRows: PermissionRow[] = [
      ...permissionRows,
      { resource: resource.resource, action: defaultAction },
    ]
    setValue('permissionRows' as Path<TFormValues>, newRows as PathValue<TFormValues, Path<TFormValues>>)
    onOpenChange(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          size="tiny"
          icon={<Plus className="h-4 w-4" />}
        >
          Add permission
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[400px] max-h-[300px] p-0" align={align}>
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search resources..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

            <CommandGroup_Shadcn_ heading="Preset options" className="[&>div]:text-left">
              <CommandItem_Shadcn_ value="add-all-permissions" onSelect={handleSelectAll}>
                <div className="flex items-center gap-3">
                  <Key size={12} />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">
                      {presetLabelPrefix}All permissions
                    </span>
                  </div>
                </div>
              </CommandItem_Shadcn_>

              <CommandItem_Shadcn_
                value="add-all-user-permissions"
                onSelect={() => handleSelectGroup('User permissions')}
              >
                <div className="flex items-center gap-3">
                  <Key size={12} />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">
                      {presetLabelPrefix}All user permissions
                    </span>
                  </div>
                </div>
              </CommandItem_Shadcn_>

              <CommandItem_Shadcn_
                value="add-all-project-permissions"
                onSelect={() => handleSelectGroup('Project permissions')}
              >
                <div className="flex items-center gap-3">
                  <Key size={12} />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">
                      {presetLabelPrefix}All project permissions
                    </span>
                  </div>
                </div>
              </CommandItem_Shadcn_>

              <CommandItem_Shadcn_
                value="add-all-organization-permissions"
                onSelect={() => handleSelectGroup('Organization permissions')}
              >
                <div className="flex items-center gap-3">
                  <Key size={12} />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">
                      {presetLabelPrefix}All organization permissions
                    </span>
                  </div>
                </div>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>

            {ACCESS_TOKEN_PERMISSIONS.map((permissionGroup) => (
              <CommandGroup_Shadcn_
                key={permissionGroup.name}
                heading={permissionGroup.name}
                className="[&>div]:text-left"
              >
                {permissionGroup.resources.map((resource) => (
                  <CommandItem_Shadcn_
                    key={resource.resource}
                    value={`${resource.resource} ${resource.title} ${permissionGroup.name}`}
                    onSelect={() => handleSelectResource(resource)}
                    className="text-white"
                  >
                    <div className="flex items-center gap-3">
                      <Key size={12} />
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-foreground">
                          {resource.title}
                        </span>
                      </div>
                    </div>
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            ))}
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export const Permissions = <TFormValues extends PermissionsFormValues = PermissionsFormValues>({
  // control,
  setValue,
  watch,
  resourceSearchOpen,
  setResourceSearchOpen,
}: PermissionsProps<TFormValues>) => {
  const permissionRows = (watch('permissionRows' as Path<TFormValues>) || []) as PermissionRow[]
  const ALL_RESOURCES = createAllResources(ACCESS_TOKEN_PERMISSIONS)

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      {permissionRows.length === 0 ? (
        <div className="space-y-3">
          <span className="text-sm">Configure permissions</span>
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-sm text-foreground-light mb-4">No permissions configured yet.</p>
            <PermissionResourceSelector
              open={resourceSearchOpen}
              onOpenChange={setResourceSearchOpen}
              permissionRows={permissionRows}
              setValue={setValue}
              allResources={ALL_RESOURCES}
              align="center"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Configure permissions</span>
            <div className="flex items-center gap-2">
              <PermissionResourceSelector
                open={resourceSearchOpen}
                onOpenChange={setResourceSearchOpen}
                permissionRows={permissionRows}
                setValue={setValue}
                allResources={ALL_RESOURCES}
                align="end"
                presetLabelPrefix="Add "
              />
              <ButtonTooltip
                type="default"
                size="tiny"
                className="p-1"
                onClick={() => {
                  setValue('permissionRows' as Path<TFormValues>, [] as PathValue<TFormValues, Path<TFormValues>>)
                }}
                icon={<RotateCcw size={16} />}
                tooltip={{
                  content: {
                    side: 'top',
                    align: 'end',
                    alignOffset: -10,
                    text: 'Reset all permissions',
                  },
                }}
              />
            </div>
          </div>

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
                          <span className="text-xs text-foreground-light">
                            {selectedResource?.group}
                          </span>
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
                            setValue('permissionRows' as Path<TFormValues>, newRows as PathValue<TFormValues, Path<TFormValues>>, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="w-[150px] h-7">
                            <SelectValue_Shadcn_ placeholder="Set access" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {selectedResource.actions.map((action) => (
                              <SelectItem_Shadcn_ key={action} value={action}>
                                {action.charAt(0).toUpperCase() + action.slice(1)}
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
                          setValue('permissionRows' as Path<TFormValues>, newRows as PathValue<TFormValues, Path<TFormValues>>)
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
        </div>
      )}

      <div className="w-full flex gap-x-2 items-center">
        <WarningIcon />
        <span className="text-xs text-left text-foreground-lighter">
          Once you've set these permissions, you cannot edit them.
        </span>
      </div>
    </div>
  )
}