import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

interface ContextBadgeProps {
  label: string
  value: string
  tooltip?: ReactNode
  onRemove?: () => void
}

export const ContextBadge = ({ label, value, tooltip, onRemove }: ContextBadgeProps) => {
  return (
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_ asChild>
        <div className="border bg-surface-200 rounded px-2 py-1 flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-1">
            <span className="text-foreground-lighter text-xs">{label}</span>
            <span className="text-xs">{value}</span>
          </div>
          {onRemove !== undefined && (
            <X
              size={12}
              className="text-foreground-light hover:text-foreground transition cursor-pointer"
              onClick={() => onRemove()}
            />
          )}
        </div>
      </TooltipTrigger_Shadcn_>
      {tooltip !== undefined && <TooltipContent_Shadcn_>{tooltip}</TooltipContent_Shadcn_>}
    </Tooltip_Shadcn_>
  )
}
