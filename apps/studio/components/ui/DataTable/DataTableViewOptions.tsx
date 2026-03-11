import { GripVertical, Settings2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import {
  Checkbox_Shadcn_,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'

import { ButtonTooltip } from '../ButtonTooltip'
import { Sortable, SortableDragHandle, SortableItem } from './primitives/Sortable'
import { useDataTable } from './providers/DataTableProvider'

export function DataTableViewOptions() {
  const { table, enableColumnOrdering } = useDataTable()
  const [open, setOpen] = useState(false)
  const [drag, setDrag] = useState(false)
  const [search, setSearch] = useState('')
  const listboxId = useId()

  const columnOrder = table.getState().columnOrder

  const sortedColumns = useMemo(
    () =>
      table.getAllColumns().sort((a, b) => {
        return columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)
      }),
    [columnOrder]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ButtonTooltip
          type="default"
          size="tiny"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="w-[26px]"
          icon={<Settings2 className="text-foreground" />}
          tooltip={{ content: { side: 'bottom', text: 'Toggle column visibility' } }}
        />
      </PopoverTrigger>
      <PopoverContent id={listboxId} side="bottom" align="end" className="w-[200px] p-0">
        <Command>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              <Sortable
                value={sortedColumns.map((c) => ({ id: c.id }))}
                onValueChange={(items) => table.setColumnOrder(items.map((c) => c.id))}
                overlay={<div className="h-8 w-full rounded-md bg-muted/60" />}
                onDragStart={() => setDrag(true)}
                onDragEnd={() => setDrag(false)}
                onDragCancel={() => setDrag(false)}
              >
                {sortedColumns
                  .filter(
                    (column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()
                  )
                  .map((column) => (
                    <SortableItem key={column.id} value={column.id} asChild>
                      <CommandItem
                        value={column.id}
                        onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                        className="capitalize p-1"
                        disabled={drag}
                      >
                        <Checkbox_Shadcn_ checked={column.getIsVisible()} className="mr-2" />
                        <span>{(column.columnDef.meta as any)?.label || column.id}</span>
                        {enableColumnOrdering && !search ? (
                          <SortableDragHandle
                            type="text"
                            size="tiny"
                            className="ml-auto size-5 text-muted-foreground hover:text-foreground focus:bg-muted focus:text-foreground"
                          >
                            <GripVertical className="size-4" aria-hidden="true" />
                          </SortableDragHandle>
                        ) : null}
                      </CommandItem>
                    </SortableItem>
                  ))}
              </Sortable>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
