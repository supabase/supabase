import { Check } from 'lucide-react'
import { cn } from 'ui'

import { OperatorSymbolBadge } from './OperatorSymbolBadge'
import { MenuItem } from './types'
import { getActionItemLabel } from './utils'

export type CommandListItemProps = {
  item: MenuItem
  isHighlighted: boolean
  includeIcon: boolean
  showSelection?: boolean
  onSelect: (item: MenuItem) => void
  setRef: (el: HTMLDivElement | null) => void
}

export function CommandListItem({
  item,
  isHighlighted,
  includeIcon,
  showSelection = false,
  onSelect,
  setRef,
}: CommandListItemProps) {
  return (
    <div
      ref={setRef}
      role="option"
      aria-disabled={item.disabled}
      onClick={() => {
        if (!item.disabled) onSelect(item)
      }}
      className={cn(
        'relative flex items-center justify-between gap-2 px-2 h-[28px] text-xs select-none outline-hidden',
        item.disabled ? 'text-muted' : 'text-foreground cursor-pointer',
        isHighlighted && 'bg-overlay-hover',
        !isHighlighted && !item.disabled && 'hover:bg-surface-200'
      )}
      data-testid={`filter-menu-item-${item.value}`}
    >
      <span className="flex items-center gap-2 min-w-0">
        {showSelection && (
          <>
            {item.disabled ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
            ) : (
              <div className="w-3.5" />
            )}
          </>
        )}
        {includeIcon && item.icon}
        <span className="truncate">{getActionItemLabel(item)}</span>
      </span>
      {item.count !== undefined && (
        <code className="text-code-inline text-foreground-light">{item.count}</code>
      )}
      {item.operatorSymbol && <OperatorSymbolBadge symbol={item.operatorSymbol} />}
    </div>
  )
}
