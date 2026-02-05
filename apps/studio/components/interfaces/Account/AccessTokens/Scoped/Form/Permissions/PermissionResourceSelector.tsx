import { Path, PathValue } from 'react-hook-form'
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
  Checkbox_Shadcn_,
} from 'ui'
import { Plus, Key } from 'lucide-react'
import { ACCESS_TOKEN_RESOURCES } from '../../../AccessToken.constants'
import {
  PermissionResource,
  PermissionRow,
  PermissionsFormValues,
  PermissionResourceSelectorProps,
} from './Permissions.types'
import { getBestAction } from './Permissions.utils'

export const PermissionResourceSelector = <TFormValues extends PermissionsFormValues>({
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
    <Popover_Shadcn_ open={open} onOpenChange={onOpenChange} modal={true}>
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

            <CommandGroup_Shadcn_ className="[&>div]:text-left">
              <div className="max-h-[210px] overflow-y-auto">
                {ACCESS_TOKEN_RESOURCES.map((resource) => {
                  const isChecked = permissionRows.some((row) => row.resource === resource.resource)
                  return (
                    <CommandItem_Shadcn_
                      key={resource.resource}
                      value={`${resource.resource} ${resource.title}`}
                      onSelect={() => handleToggleResource(resource)}
                      className="text-foreground"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Checkbox_Shadcn_
                          checked={isChecked}
                          onCheckedChange={() => handleToggleResource(resource)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Key size={12} className="text-foreground-lighter" />
                        <div className="flex flex-col text-left flex-1">
                          <span className="font-medium text-foreground capitalize">
                            {resource.title}
                          </span>
                        </div>
                      </div>
                    </CommandItem_Shadcn_>
                  )
                })}
              </div>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}