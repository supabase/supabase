import {
  cn,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
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
    <Command_Shadcn_>
      <CommandList_Shadcn_>
        <CommandGroup_Shadcn_>
          {items.length === 0 && (
            <CommandItem_Shadcn_ disabled className="cursor-default px-4">
              <p className="text-foreground-light">{emptyMessage}</p>
            </CommandItem_Shadcn_>
          )}
          {items.map((item) => {
            const isActive = item.name === selectedResource
            return (
              <CommandItem_Shadcn_
                key={item.name}
                className={cn(
                  'cursor-pointer px-4',
                  isActive ? 'text-foreground bg-selection' : 'text-foreground-light'
                )}
                onSelect={() => handleSelect(item.name)}
              >
                <p className="truncate">{item.name}</p>
              </CommandItem_Shadcn_>
            )
          })}
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
