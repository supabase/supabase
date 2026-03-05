import Link from 'next/link'
import { cn, SidebarMenuItem, sidebarMenuButtonVariants } from 'ui'

import type { OrgNavItem } from './OrgMenuContent.utils'

export interface OrgMenuItemProps {
  item: OrgNavItem
  isActive: boolean
  disabled?: boolean
  onCloseSheet?: () => void
}

export function OrgMenuItem({
  item,
  isActive,
  disabled = false,
  onCloseSheet,
}: OrgMenuItemProps) {
  const menuButtonClass = cn(
    sidebarMenuButtonVariants({ size: 'default', hasIcon: true }),
    disabled && 'opacity-50 pointer-events-none'
  )

  return (
    <SidebarMenuItem key={item.key}>
      <Link
        href={item.href}
        onClick={onCloseSheet}
        data-active={isActive}
        className={menuButtonClass}
      >
        <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0">
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    </SidebarMenuItem>
  )
}
