import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCode,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { Operation } from './RLSTestSidePanel.types'

interface OperationSelectProps {
  operation: Operation
  onSelectOperation: (operation: Operation) => void
}

const operations = ['insert', 'update', 'delete', 'select']

const OperationSelect = ({ operation, onSelectOperation }: OperationSelectProps) => {
  const [open, setOpen] = useState(false)

  const onSelectOption = (operation: Operation) => {
    onSelectOperation(operation)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-sm">Type of operation</p>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="outline"
            className={`w-full [&>span]:w-full`}
            iconRight={
              <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
            }
          >
            <div className="w-full flex space-x-3 py-0.5">
              <p className="text-sm capitalize">{operation}</p>
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                {operations.map((op) => (
                  <CommandItem_Shadcn_
                    key={op}
                    value={op}
                    className="text-sm cursor-pointer capitalize"
                    onSelect={() => onSelectOption(op as Operation)}
                    onClick={() => onSelectOption(op as Operation)}
                  >
                    {op}
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default OperationSelect
