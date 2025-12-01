import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'
import { Button, Command_Shadcn_, CommandItem_Shadcn_, CommandList_Shadcn_, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, ScrollArea } from 'ui'

interface Props<TRow, TSummaryRow = unknown> extends RenderEditCellProps<TRow, TSummaryRow> {
  isNullable?: boolean
}

export const BooleanEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  onRowChange,
}: Props<TRow, TSummaryRow>) => {
  const [open, setOpen] = useState(true)

  const value = row[column.key as keyof TRow] as boolean | null

  const onChange = (newValue: boolean | null) => {
    if (newValue !== value) {
      onRowChange({ ...row, [column.key]: newValue }, true)
    }
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          data-testid="schema-selector"
          className={`w-full h-full [&>span]:w-full rounded-none !pr-1 space-x-1`}
          iconRight={
            <ChevronsUpDown strokeWidth={3} size={18} />
          }
        >
          <div className="w-full flex gap-1">
            <p>{value === null ? 'NULL' : value ? 'TRUE' : 'FALSE'}</p>
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="p-0 rounded-none pointer-events-auto"
        side="bottom"
        sameWidthAsTrigger
      >
        <Command_Shadcn_>
          <CommandList_Shadcn_>
              <ScrollArea>
                <CommandItem_Shadcn_
                  key="TRUE"
                  className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                  onSelect={() => {
                    onChange(true)
                    setOpen(false)
                  }}
                  onClick={() => {
                    onChange(true)
                    setOpen(false)
                  }}
                >
                  <span className="text-foreground">TRUE</span>
                  {value === true && (
                    <Check className="text-brand" strokeWidth={2} size={16} />
                  )}
                </CommandItem_Shadcn_>
                <CommandItem_Shadcn_
                  key="FALSE"
                  className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                  onSelect={() => {
                    onChange(false)
                    setOpen(false)
                  }}
                  onClick={() => {
                    onChange(false)
                    setOpen(false)
                  }}
                >
                  <span className="text-foreground">FALSE</span>
                  {value === false && (
                    <Check className="text-brand" strokeWidth={2} size={16} />
                  )}
                </CommandItem_Shadcn_>
                {isNullable && <CommandItem_Shadcn_
                  key="NULL"
                  className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  onClick={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <span className="text-foreground">NULL</span>
                  {value === null && (
                    <Check className="text-brand" strokeWidth={2} size={16} />
                  )}
                </CommandItem_Shadcn_>}
              </ScrollArea>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
