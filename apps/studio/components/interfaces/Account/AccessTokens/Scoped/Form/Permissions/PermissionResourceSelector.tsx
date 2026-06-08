import { Key, Plus } from 'lucide-react'
import { Path, PathValue } from 'react-hook-form'
import {
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import {
  PermissionResource,
  PermissionResourceSelectorProps,
  PermissionRow,
  PermissionsFormValues,
} from './Permissions.types'
import { togglePermissionResource } from './Permissions.utils'
import { ACCESS_TOKEN_RESOURCES } from '@/components/interfaces/Account/AccessTokens/AccessToken.constants'

export const PermissionResourceSelector = <TFormValues extends PermissionsFormValues>({
  open,
  onOpenChange,
  permissionRows,
  setValue,
  align = 'center',
}: PermissionResourceSelectorProps<TFormValues>) => {
  const handleToggleResource = (resource: PermissionResource) => {
    const newRows = togglePermissionResource(permissionRows, resource)
    setValue(
      'permissionRows' as Path<TFormValues>,
      newRows as PathValue<TFormValues, Path<TFormValues>>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button type="default" size="tiny" icon={<Plus className="h-4 w-4" />}>
          Add permission
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align={align}>
        <Command>
          <CommandInput placeholder="Search resources..." />
          <CommandList>
            <CommandEmpty>No resources found.</CommandEmpty>

            <CommandGroup className="[&>div]:text-left">
              <div className="max-h-[210px] overflow-y-auto">
                {ACCESS_TOKEN_RESOURCES.map((resource) => {
                  const isChecked = permissionRows.some(
                    (row: PermissionRow) => row.resource === resource.resource
                  )
                  return (
                    <CommandItem
                      key={resource.resource}
                      value={`${resource.resource} ${resource.title}`}
                      onSelect={() => handleToggleResource(resource)}
                      className="text-foreground"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Checkbox
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
                    </CommandItem>
                  )
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
