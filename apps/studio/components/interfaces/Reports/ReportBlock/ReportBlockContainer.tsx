import { GripHorizontal, Loader2 } from 'lucide-react'
import { DragEvent, PropsWithChildren, ReactNode } from 'react'
import { Card, CardTitle, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface ReportBlockContainerProps {
  icon: ReactNode
  label: string
  actions: ReactNode
  loading?: boolean
  draggable?: boolean
  showDragHandle?: boolean
  tooltip?: ReactNode
  onDragStart?: (e: DragEvent) => void
  dragAttributes?: Record<string, any>
  dragListeners?: Record<string, any>
}

export const ReportBlockContainer = ({
  icon,
  label,
  actions,
  loading = false,
  draggable = false,
  showDragHandle = false,
  tooltip,
  onDragStart,
  dragAttributes,
  dragListeners,
  children,
}: PropsWithChildren<ReportBlockContainerProps>) => {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).filter((x) => !!x.props.children).length > 0
    : !!children

  return (
    <Card
      draggable={draggable}
      unselectable={draggable ? 'on' : undefined}
      onDragStart={onDragStart}
      className="h-full flex flex-col overflow-hidden"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'grid-item-drag-handle flex py-1 pl-3 pr-1 items-center gap-2 z-10 shrink-0 group',
              draggable && 'cursor-move'
            )}
            {...dragAttributes}
            {...dragListeners}
          >
            <CardTitle title={label} className="flex-1 truncate text-foreground-light">
              {label}
            </CardTitle>
            <div className="flex items-center">{actions}</div>
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent asChild side="bottom">
            {tooltip}
          </TooltipContent>
        )}
      </Tooltip>
      <div className={cn('flex flex-col flex-grow items-center', hasChildren && 'border-t')}>
        {children}
      </div>
    </Card>
  )
}
