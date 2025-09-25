import { Code, GripHorizontal } from 'lucide-react'
import { DragEvent, PropsWithChildren, ReactNode } from 'react'

import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface ReportBlockContainerProps {
  icon?: ReactNode
  label: string
  badge?: ReactNode
  actions: ReactNode
  loading?: boolean
  draggable?: boolean
  showDragHandle?: boolean
  tooltip?: ReactNode
  onDragStart?: (e: DragEvent) => void
}

export const ReportBlockContainer = ({
  icon,
  label,
  badge,
  actions,
  loading = false,
  draggable = false,
  showDragHandle = false,
  tooltip,
  onDragStart,
  children,
}: PropsWithChildren<ReportBlockContainerProps>) => {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).filter((x) => !!x.props.children).length > 0
    : !!children

  return (
    <div
      draggable={draggable}
      unselectable={draggable ? 'on' : undefined}
      onDragStart={onDragStart}
      className="h-full flex flex-col overflow-hidden bg-surface-100 border-overlay relative rounded border shadow-sm"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'grid-item-drag-handle flex py-1 pl-3 pr-1 items-center gap-2 z-10 shrink-0 group h-9',
              draggable && 'cursor-move'
            )}
          >
            {showDragHandle ? (
              <div className="absolute left-3 top-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <GripHorizontal size={16} strokeWidth={1.5} />
              </div>
            ) : icon ? (
              icon
            ) : (
              <Code size={16} strokeWidth={1.5} className="text-foreground-muted" />
            )}
            <div
              className={cn(
                'flex items-center gap-2 flex-1 transition-opacity',
                showDragHandle && 'group-hover:opacity-25'
              )}
            >
              <h3 className="heading-meta truncate">{label}</h3>
              {badge && <div className="flex items-center shrink-0">{badge}</div>}
            </div>
            <div className="flex items-center">{actions}</div>
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent asChild side="bottom">
            {tooltip}
          </TooltipContent>
        )}
      </Tooltip>
      <div
        className={cn(
          'relative flex flex-col flex-grow w-full',
          hasChildren && 'border-t overflow-hidden'
        )}
      >
        <div
          className={cn(
            'flex flex-col flex-grow items-center overflow-hidden',
            loading && 'pointer-events-none'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
