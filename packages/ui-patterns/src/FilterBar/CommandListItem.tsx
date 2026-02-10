import { Check } from 'lucide-react'
import { cn } from 'ui'

import { OperatorSymbolBadge } from './OperatorSymbolBadge'
import { MenuItem } from './types'

export type CommandListItemProps = {
  item: MenuItem
  isHighlighted: boolean
  isSelected: boolean
  includeIcon: boolean
  onSelect: (item: MenuItem) => void
  setRef: (el: HTMLDivElement | null) => void
}

export function CommandListItem({
  item,
  isHighlighted,
  isSelected,
  includeIcon,
  onSelect,
  setRef,
}: CommandListItemProps) {
  return (
    <div
      ref={setRef}
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(item)}
      className={cn(
        'relative flex items-center justify-between gap-2 px-2 py-1.5 text-xs cursor-pointer select-none outline-none text-foreground-light',
        isHighlighted && 'bg-surface-300',
        !isHighlighted && 'hover:bg-surface-200'
      )}
    >
      <span className="flex items-center gap-2">
        {includeIcon && item.icon}
        {item.label}
      </span>
      <span className="flex items-center gap-1.5">
        {item.operatorSymbol && <OperatorSymbolBadge symbol={item.operatorSymbol} />}
        {isSelected && <Check className="h-4 w-4 text-foreground-muted" strokeWidth={2} />}
      </span>
    </div>
  )
}
