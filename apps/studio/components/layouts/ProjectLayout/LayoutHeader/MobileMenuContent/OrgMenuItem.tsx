import Link from 'next/link'
import { cn, SidebarMenuItem, sidebarMenuButtonVariants } from 'ui'

import type { OrgNavItem } from './OrgMenuContent.utils'

export interface OrgMenuItemProps {
  item: OrgNavItem
  isActive: boolean
  disabled?: boolean
  onCloseSheet?: () => void
  onSubmenuClick?: (item: OrgNavItem) => void
  onSelect?: () => void
}

export function OrgMenuItem({
  item,
  isActive,
  disabled = false,
  onCloseSheet,
  onSubmenuClick,
  onSelect,
}: OrgMenuItemProps) {
  const menuButtonClass = cn(
    sidebarMenuButtonVariants({ size: 'default', hasIcon: true }),
    disabled && 'opacity-50 pointer-events-none'
  )

  const content = (
    <>
      <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0">
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </>
  )

  return (
    <SidebarMenuItem key={item.key}>
      {onSubmenuClick ? (
        <button
          type="button"
          data-active={isActive}
          onClick={() => onSubmenuClick?.(item)}
          disabled={disabled}
          className={menuButtonClass}
        >
          {content}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={() => {
            onSelect?.()
            onCloseSheet?.()
          }}
          data-active={isActive}
          className={menuButtonClass}
        >
          {content}
        </Link>
      )}
    </SidebarMenuItem>
  )
}
