import type { ReactNode } from 'react'
import { cn } from 'ui'

export interface SqlEditorPanelHeaderProps {
  title: ReactNode
  /** Rendered left of run controls (e.g. show/hide SQL) */
  leadingActions?: ReactNode
  /** Run controls: source selector, role impersonation, run button, more menu */
  runActions?: ReactNode
  className?: string
}

export const SqlEditorPanelHeader = ({
  title,
  leadingActions,
  runActions,
  className,
}: SqlEditorPanelHeaderProps) => {
  const hasToolbarActions = leadingActions || runActions

  if (!title && !hasToolbarActions) return null

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2',
        className
      )}
    >
      <div className="min-w-0 flex-1 truncate text-sm font-medium">{title}</div>
      {hasToolbarActions ? (
        <div className="flex shrink-0 items-center gap-x-1">
          {leadingActions}
          {runActions}
        </div>
      ) : null}
    </div>
  )
}
