import { PlusIcon } from 'lucide-react'
import { cn } from 'ui'

interface NewViewEntryProps {
  disabled: boolean
  onClick: () => void
}

export const NewViewEntry = ({ disabled, onClick }: NewViewEntryProps) => {
  return (
    <button
      type="button"
      tabIndex={0}
      disabled={disabled}
      onClick={onClick}
      aria-label="Save current filters as a new view"
      title={disabled ? 'Add a filter to save a view' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm focus-ring',
        disabled
          ? 'cursor-not-allowed text-foreground-muted opacity-50'
          : 'text-foreground-light hover:bg-surface-200'
      )}
    >
      <PlusIcon size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">New view</span>
    </button>
  )
}
