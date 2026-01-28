import { X } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface SortIndicatorProps {
  sort: { column: string; order: string }
  onClearSort: () => void
}

export const SortIndicator = ({ sort, onClearSort }: SortIndicatorProps) => {
  return (
    <div className="text-xs border rounded-md px-1.5 md:px-2.5 py-1 h-[26px] flex items-center gap-x-2">
      <p className="md:inline-flex gap-x-1 hidden truncate">
        Sort: {sort.column} <span className="text-foreground-lighter">{sort.order}</span>
      </p>
      <Tooltip>
        <TooltipTrigger onClick={onClearSort}>
          <X size={14} className="text-foreground-light hover:text-foreground" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Clear sort</TooltipContent>
      </Tooltip>
    </div>
  )
}
