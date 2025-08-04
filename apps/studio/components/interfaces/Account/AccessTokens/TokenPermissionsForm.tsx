import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  WarningIcon,
} from 'ui'
import { Plus, Key, X } from 'lucide-react'
import { createAllResources } from './AccessToken.utils'
import { ACCESS_TOKEN_PERMISSIONS } from './AccessToken.constants'

interface TokenPermissionsFormProps {
  control: Control<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
}

export const TokenPermissionsForm = ({
  control,
  setValue,
  watch,
  resourceSearchOpen,
  setResourceSearchOpen,
}: TokenPermissionsFormProps) => {
  const permissionRows = watch('permissionRows') || []
  const ALL_RESOURCES = createAllResources(ACCESS_TOKEN_PERMISSIONS)

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      {permissionRows.length === 0 ? (
        <div className="space-y-3">
          <span className="text-sm">Configure permissions</span>
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-sm text-foreground-light mb-4">No permissions configured yet.</p>
            <Popover_Shadcn_ open={resourceSearchOpen} onOpenChange={setResourceSearchOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default" icon={<Plus className="h-4 w-4" />}>
                  Add permission
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="w-[400px] p-0" align="center">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search resources..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

                    {/* Preset Options */}
                    <CommandGroup_Shadcn_ heading="Preset options" className="[&>div]:text-left">
                      <CommandItem_Shadcn_
                        value="add-all-permissions"
                        onSelect={() => {
                          const allPermissions = ALL_RESOURCES.map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', allPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">All permissions</span>
                          </div>
                        </div>
                      </CommandItem_Shadcn_>

                      <CommandItem_Shadcn_
                        value="add-all-project-permissions"
                        onSelect={() => {
                          const projectPermissions = ALL_RESOURCES.filter(
                            (resource) => resource.group === 'Project permissions'
                          ).map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', projectPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">
                              All project permissions
                            </span>
                          </div>
                        </div>
                      </CommandItem_Shadcn_>

                      <CommandItem_Shadcn_
                        value="add-all-organization-permissions"
                        onSelect={() => {
                          const orgPermissions = ALL_RESOURCES.filter(
                            (resource) => resource.group === 'Organization permissions'
                          ).map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', orgPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">
                              All organization permissions
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
                            onSelect={() => {
                              const newRows = [
                                ...permissionRows,
                                { resource: resource.resource, action: '' },
                              ]
                              setValue('permissionRows', newRows)
                              setResourceSearchOpen(false)
                            }}
                            className="text-white"
                          >
                            <div className="flex items-center gap-3">
                              <Key size={12} />
                              <div className="flex flex-col text-left">
                                <span className="font-medium text-foreground">{resource.title}</span>
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
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Configure permissions</span>
            <Popover_Shadcn_ open={resourceSearchOpen} onOpenChange={setResourceSearchOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default" size="tiny" icon={<Plus className="h-4 w-4" />}>
                  Add permission
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="w-[400px] p-0" align="end">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search resources..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

                    {/* Preset Options */}
                    <CommandGroup_Shadcn_ heading="Preset options" className="[&>div]:text-left">
                      <CommandItem_Shadcn_
                        value="add-all-permissions"
                        onSelect={() => {
                          const allPermissions = ALL_RESOURCES.map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', allPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">Add all permissions</span>
                          </div>
                        </div>
                      </CommandItem_Shadcn_>

                      <CommandItem_Shadcn_
                        value="add-all-project-permissions"
                        onSelect={() => {
                          const projectPermissions = ALL_RESOURCES.filter(
                            (resource) => resource.group === 'Project permissions'
                          ).map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', projectPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">
                              Add all project permissions
                            </span>
                          </div>
                        </div>
                      </CommandItem_Shadcn_>

                      <CommandItem_Shadcn_
                        value="add-all-organization-permissions"
                        onSelect={() => {
                          const orgPermissions = ALL_RESOURCES.filter(
                            (resource) => resource.group === 'Organization permissions'
                          ).map((resource) => ({
                            resource: resource.resource,
                            action: resource.actions.includes('read-write')
                              ? 'read-write'
                              : resource.actions[0],
                          }))
                          setValue('permissionRows', orgPermissions)
                          setResourceSearchOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={12} />
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">
                              Add all organization permissions
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
                            onSelect={() => {
                              const newRows = [
                                ...permissionRows,
                                { resource: resource.resource, action: '' },
                              ]
                              setValue('permissionRows', newRows)
                              setResourceSearchOpen(false)
                            }}
                            className="text-white"
                          >
                            <div className="flex items-center gap-3">
                              <Key size={12} />
                              <div className="flex flex-col text-left">
                                <span className="font-medium">{resource.title}</span>
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
          </div>

          <div className="border border-border rounded-lg">
            {permissionRows.map((row: any, index: number) => {
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
                            const newRows = [...permissionRows]
                            newRows[index] = { ...newRows[index], action: value }
                            setValue('permissionRows', newRows)
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="w-[150px] h-7">
                            <SelectValue_Shadcn_ placeholder="Set access" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {selectedResource.actions.map((action: string) => (
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
                          const newRows = permissionRows.filter((_: any, i: number) => i !== index)
                          setValue('permissionRows', newRows)
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
