import { cn } from 'ui'

import { OperatorSymbolBadge } from './OperatorSymbolBadge'
import { MenuItem } from './types'
import { getActionItemLabel } from './utils'

export type CommandListItemProps = {
  item: MenuItem
  isHighlighted: boolean
  includeIcon: boolean
  onSelect: (item: MenuItem) => void
  setRef: (el: HTMLDivElement | null) => void
}

export function CommandListItem({
  item,
  isHighlighted,
  includeIcon,
  onSelect,
  setRef,
}: CommandListItemProps) {
  return (
    <div
      ref={setRef}
      role="option"
      onClick={() => onSelect(item)}
      className={cn(
        'relative flex items-center justify-between gap-2 px-2 py-1.5 text-xs cursor-pointer select-none outline-none text-foreground-light',
        isHighlighted && 'bg-surface-300',
        !isHighlighted && 'hover:bg-surface-200'
      )}
      data-testid={`filter-menu-item-${item.value}`}
    >
      <span className="flex items-center gap-2">
        {includeIcon && item.icon}
        {getActionItemLabel(item)}
      </span>
      {item.operatorSymbol && <OperatorSymbolBadge symbol={item.operatorSymbol} />}
    </div>
  )
}
