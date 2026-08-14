import { cn, Command, CommandGroup, CommandItem, CommandList } from 'ui'

import type { ResourcePickerRenderProps } from './SecondLevelNav.Layout'

type NamedResource = { name: string }

type ResourcePickerListProps = ResourcePickerRenderProps & {
  items: NamedResource[]
  emptyMessage: string
}

export const ResourcePickerList = ({
  items,
  emptyMessage,
  selectedResource,
  onSelect,
  closePopover,
}: ResourcePickerListProps) => {
  const handleSelect = (value: string) => {
    onSelect(value)
    closePopover()
  }

  return (
    <Command>
      <CommandList>
        <CommandGroup>
          {items.length === 0 && (
            <CommandItem disabled className="cursor-default px-4">
              <p className="text-foreground-light">{emptyMessage}</p>
            </CommandItem>
          )}
          {items.map((item) => {
            const isActive = item.name === selectedResource
            return (
              <CommandItem
                key={item.name}
                className={cn(
                  'cursor-pointer px-4',
                  isActive ? 'text-foreground bg-selection' : 'text-foreground-light'
                )}
                onSelect={() => handleSelect(item.name)}
              >
                <p className="truncate">{item.name}</p>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
