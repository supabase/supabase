import { Plus, X, Key } from 'lucide-react'
import { type Control } from 'react-hook-form'
import { toast } from 'sonner'

import {
  Button,
  WarningIcon,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
} from 'ui'

import { ACCESS_TOKEN_PERMISSIONS } from '../AccessToken.constants'

// Create a flat list of all available resources for the searchable dropdown
const ALL_RESOURCES = ACCESS_TOKEN_PERMISSIONS.flatMap((group) =>
  group.resources.map((resource) => ({
    resource: resource.resource,
    title: resource.title,
    actions: resource.actions,
    group: group.name,
  }))
)

interface Step3PermissionsProps {
  control: Control<any>
  permissionRows: any[]
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
  form: any
  onSubmit: () => void
  isLoading: boolean
}

const Step3Permissions = ({
  control,
  permissionRows,
  resourceSearchOpen,
  setResourceSearchOpen,
  form,
  onSubmit,
  isLoading,
}: Step3PermissionsProps) => {
  return (
    <>
      <div className="space-y-4">
        {permissionRows.length === 0 ? (
          <>
            <h3 className="text-sm font-medium">Configure permissions</h3>
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <p className="text-sm text-foreground-light mb-4">
                No permissions configured yet. Add permissions to control what this token can
                access.
              </p>
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
                      <CommandGroup_Shadcn_>
                        {ALL_RESOURCES.map((resource) => (
                          <CommandItem_Shadcn_
                            key={resource.resource}
                            value={resource.resource}
                            onSelect={() => {
                              const newRows = [
                                ...permissionRows,
                                { resource: resource.resource, action: '' },
                              ]
                              form.setValue('permissionRows', newRows)
                              setResourceSearchOpen(false)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Key size={12} />
                              <div className="flex flex-col text-left">
                                <span className="font-medium text-foreground">
                                  {resource.title}
                                </span>
                                <span className="text-xs text-foreground-light">
                                  {resource.group}
                                </span>
                              </div>
                            </div>
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Configure permissions</h3>
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
                      <CommandGroup_Shadcn_>
                        {ALL_RESOURCES.map((resource) => (
                          <CommandItem_Shadcn_
                            key={resource.resource}
                            value={resource.resource}
                            onSelect={() => {
                              const newRows = [
                                ...permissionRows,
                                { resource: resource.resource, action: '' },
                              ]
                              form.setValue('permissionRows', newRows)
                              setResourceSearchOpen(false)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Key size={12} />
                              <div className="flex flex-col text-left">
                                <span className="font-medium">{resource.title}</span>
                                <span className="text-xs text-foreground-light">
                                  {resource.group}
                                </span>
                              </div>
                            </div>
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
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
                            <span className="text-sm font-medium truncate max-w-[24ch]">
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
                              form.setValue('permissionRows', newRows)
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
                            form.setValue('permissionRows', newRows)
                          }}
                          icon={<X size={16} />}
                        />
                      </div>
                    </div>
                    {index < permissionRows.length - 1 && (
                      <div className="border-t border-border" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="w-full flex gap-x-2 py-2 items-center">
          <WarningIcon />
          <span className="text-xs text-left text-foreground-lighter">
            Once you've set these permissions, you cannot edit them.
          </span>
        </div>
      </div>


    </>
  )
}

export default Step3Permissions 