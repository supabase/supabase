import { ChevronRightIcon, Layers2Icon } from 'lucide-react'
import { cn } from 'ui'

import { type LogsView } from '../UnifiedLogs.views'

interface SavedViewsEntryProps {
  activeView: LogsView | null
  isActiveViewModified: boolean
  onOpen: () => void
}

export const SavedViewsEntry = ({
  activeView,
  isActiveViewModified,
  onOpen,
}: SavedViewsEntryProps) => {
  const getStateClassName = () => {
    if (!activeView) return 'text-foreground-light'
    if (isActiveViewModified) return 'text-warning'
    return 'text-brand-600'
  }
  const stateClassName = getStateClassName()

  const getAriaLabel = () => {
    if (!activeView) return 'Saved views'
    if (isActiveViewModified) return `Saved views · ${activeView.name} (modified)`
    return `Saved views · ${activeView.name}`
  }
  const ariaLabel = getAriaLabel()

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onOpen}
      aria-label={ariaLabel}
      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-200 focus-ring"
    >
      <Layers2Icon size={14} className={cn('shrink-0', stateClassName)} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', stateClassName)}>Saved views</span>
      <ChevronRightIcon size={14} className="shrink-0 text-foreground-muted" />
    </button>
  )
}
