import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface UserActivityOmittedEventsItemProps {
  count: number
  expanded: boolean
  onToggle: () => void
  /** Hide the connector line below the item */
  isLast?: boolean
}

export const UserActivityOmittedEventsItem = ({
  count,
  expanded,
  onToggle,
  isLast = false,
}: UserActivityOmittedEventsItemProps) => {
  const noun = count === 1 ? 'event' : 'events'
  const label = expanded ? `Hide ${count} ${noun}` : `${count} omitted ${noun}`

  return (
    <div className="relative flex gap-x-4">
      {/* Connector line + dot */}
      <div className="relative flex w-3 shrink-0 justify-center">
        {!isLast && (
          <span className="absolute top-4 bottom-[-1.25rem] w-px bg-border" aria-hidden />
        )}
        <span className="relative z-10 mt-3 h-2.5 w-2.5 rounded-full bg-border" aria-hidden />
      </div>

      {/* Summary row */}
      <div className={cn('mb-3 flex-1 py-4')}>
        <div className="border-top border h-px w-full items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="text"
                size="tiny"
                block
                iconLeft={
                  expanded ? (
                    <ChevronDown size={14} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={14} strokeWidth={1.5} />
                  )
                }
                className="hover:bg-inherit -top-4"
                onClick={onToggle}
              >
                {label}
              </Button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent>
                <p>These events were omitted for brevity. Click to expand.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
