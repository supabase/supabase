import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_, cn } from 'ui'

export const QueryPanelContainer = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex flex-col gap-y-6 py-4', className)}>{children}</div>
)

export const QueryPanelSection = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('px-5 flex flex-col gap-y-2', className)}>{children}</div>
)

export const QueryPanelScoreSection = ({
  className,
  name,
  description,
  before,
  after,
  hideArrowMarkers = false,
}: {
  className?: string
  name: string
  description: string
  before?: number
  after?: number
  hideArrowMarkers?: boolean
}) => (
  <div className={cn('py-4 px-4 flex', className)}>
    <div className="flex gap-x-2 w-48">
      <span className="text-sm">{name}</span>
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild className="mt-1">
          <InformationCircleIcon className="transition text-foreground-muted w-3 h-3 data-[state=delayed-open]:text-foreground-light" />
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="top" className="w-52 text-center">
          {description}
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    </div>
    <div className="flex flex-col gap-y-1">
      <div className="flex gap-x-2 text-sm">
        <span className="text-foreground-light w-20">Currently:</span>
        <span
          className={cn(
            'font-mono',
            before !== undefined && after !== undefined && before !== after
              ? 'text-foreground-light'
              : ''
          )}
        >
          {before}
        </span>
      </div>
      {before !== undefined && after !== undefined && before !== after && (
        <div className="flex items-center gap-x-2 text-sm">
          <span className="text-foreground-light w-20">With index:</span>
          <span className="font-mono">{after}</span>
          {before !== undefined && !hideArrowMarkers && (
            <div className="flex items-center gap-x-1">
              {after > before ? (
                <ArrowUp size={14} className="text-warning" />
              ) : (
                <ArrowDown size={14} className="text-brand" />
              )}
              {before !== 0 && (
                <span
                  className={cn(
                    'font-mono tracking-tighter',
                    after > before ? 'text-warning' : 'text-brand'
                  )}
                >
                  {(((before - after) / before) * 100).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)
