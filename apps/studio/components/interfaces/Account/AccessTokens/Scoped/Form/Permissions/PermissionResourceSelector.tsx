import { Key, Plus } from 'lucide-react'
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

import { PermissionResourceSelectorProps, PermissionRow } from './Permissions.types'
import { ACCESS_TOKEN_RESOURCES } from '@/components/interfaces/Account/AccessTokens/AccessToken.constants'

export const PermissionResourceSelector = ({
  open,
  onOpenChange,
  onResourceToggled,
  permissionRows,
  align = 'center',
}: PermissionResourceSelectorProps) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button variant="default" size="tiny" icon={<Plus className="h-4 w-4" />}>
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
                      onSelect={() => onResourceToggled(resource)}
                      className="text-foreground"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onResourceToggled(resource)}
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
