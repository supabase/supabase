import { X } from 'lucide-react'

import { SheetClose, SheetHeader, SheetTitle, cn } from 'ui'

interface CreateFunctionHeaderProps {
  selectedFunction?: string
  isDuplicating?: boolean
}

export const CreateFunctionHeader = ({
  selectedFunction,
  isDuplicating,
}: CreateFunctionHeaderProps) => {
  return (
    <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
      <div className="flex flex-row gap-3 items-center max-w-[75%]">
        <SheetClose
          className={cn(
            'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none data-[state=open]:bg-secondary',
            'transition'
          )}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close</span>
        </SheetClose>
        <SheetTitle className="truncate">
          {selectedFunction !== undefined
            ? isDuplicating
              ? `Duplicate function`
              : `Edit '${selectedFunction}' function`
            : 'Add a new function'}
        </SheetTitle>
      </div>
    </SheetHeader>
  )
}
