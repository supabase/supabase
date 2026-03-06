import { X } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface FilterPillProps {
  label: string
  value: string
  onClear: (e: React.MouseEvent) => void
}

export const FilterPill = ({ label, value, onClear }: FilterPillProps) => {
  return (
    <div className="text-xs border rounded-md px-1.5 md:px-2.5 py-1 h-[26px] flex items-center gap-x-2">
      <p className="md:inline-flex gap-x-1 hidden truncate">
        {label}: <span className="text-foreground-lighter">{value}</span>
      </p>
      <Tooltip>
        <TooltipTrigger
          onClick={(e) => {
            e.stopPropagation()
            onClear(e)
          }}
        >
          <X size={14} className="text-foreground-light hover:text-foreground" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Clear {label.toLowerCase()} filter</TooltipContent>
      </Tooltip>
    </div>
  )
}
