import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from 'ui'

export interface SearchInputRowProps {
  icon: ReactNode
  children: ReactNode
  onClear?: () => void
  clearLabel?: string
  beam?: ReactNode
  hasMorph?: boolean
  className?: string
}

export function SearchInputRow({
  icon,
  children,
  onClear,
  clearLabel = 'Clear',
  beam,
  hasMorph = true,
  className,
}: SearchInputRowProps) {
  // cmdk's root turns enter into "open highlighted result", so keep it on the button.
  // other keys must bubble, or tab never reaches the dialog's focus trap
  const handleClearKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') event.stopPropagation()
  }

  return (
    <div className={cn('relative flex items-center gap-3 pr-4', className)}>
      <div className="flex flex-1 items-center pl-3">
        <span
          className={cn(
            'flex size-4 shrink-0 text-foreground-lighter',
            hasMorph ? '[view-transition-name:search-dialog-icon]' : undefined
          )}
        >
          {icon}
        </span>
        <div
          className={cn(
            'flex h-12 flex-1 items-center pl-2.5 text-search-dialog text-foreground',
            hasMorph ? '[view-transition-name:search-dialog-input]' : undefined
          )}
        >
          {children}
        </div>
      </div>
      {onClear ? (
        <button
          type="button"
          tabIndex={0}
          onClick={onClear}
          onKeyDown={handleClearKeyDown}
          className="relative -mx-2 shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs text-foreground-lighter transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] hover:bg-overlay-hover hover:text-foreground focus-ring"
        >
          {clearLabel}
        </button>
      ) : null}
      {beam}
    </div>
  )
}
