import { useState } from 'react'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'

interface TextSearchPopoverProps {
  name: string
  value: string
  onSaveText: (value: string) => void
}

export const TextSearchPopover = ({ name, value = '', onSaveText }: TextSearchPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string>(value)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          asChild
          type={value.length > 0 ? 'default' : 'dashed'}
          onClick={() => setOpen(false)}
        >
          <div className="max-w-[170px]">
            <span>{name}</span>
            {value.length > 0 && <span className="mr-1">:</span>}
            <span className="truncate">{value}</span>
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
        <div className="space-y-4 p-3 min-w-[170px]">
          <TextArea_Shadcn_
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            rows={4}
            className="text-xs font-mono tracking-tight"
            placeholder="Search for a query"
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-overlay bg-surface-200 py-2 px-3">
          <Button
            size="tiny"
            type="default"
            onClick={() => {
              onSaveText('')
              setSearch('')
              setOpen(false)
            }}
          >
            Clear
          </Button>
          <Button
            type="primary"
            onClick={() => {
              onSaveText(search)
              setOpen(false)
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
