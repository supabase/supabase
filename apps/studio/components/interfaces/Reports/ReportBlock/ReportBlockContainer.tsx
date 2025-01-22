import { GripHorizontal } from 'lucide-react'
import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

interface ReportBlockContainerProps {
  icon: ReactNode
  label: string
  actions: ReactNode
  draggable?: boolean
}

export const ReportBlockContainer = ({
  icon,
  label,
  actions,
  draggable = false,
  children,
}: PropsWithChildren<ReportBlockContainerProps>) => {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).filter((x) => !!x.props.children).length > 0
    : !!children

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-100 border-overlay relative rounded border shadow-sm">
      <div className="grid-item-drag-handle cursor-move flex py-1 pl-3 pr-1 items-center gap-2 z-10 shrink-0 group">
        <div className={cn(draggable && 'transition-opacity opacity-100 group-hover:opacity-0')}>
          {icon}
        </div>
        {draggable && (
          <div className="absolute left-3 top-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <GripHorizontal size={16} strokeWidth={1.5} />
          </div>
        )}
        <h3 className="text-xs font-medium text-foreground-light flex-1">{label}</h3>
        <div className="flex items-center">{actions}</div>
      </div>
      <div
        className={cn(
          'flex flex-col flex-grow items-center justify-center',
          hasChildren && 'border-t'
        )}
      >
        {children}
      </div>
    </div>
  )
}
