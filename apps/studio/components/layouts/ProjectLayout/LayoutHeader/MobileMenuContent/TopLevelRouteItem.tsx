import type { Route } from 'components/ui/ui.types'
import Link from 'next/link'
import { cn, sidebarMenuButtonVariants, SidebarMenuItem } from 'ui'

import { isDirectLinkAtTopLevel } from './useMobileMenuNavigation'

export interface TopLevelRouteItemProps {
  route: Route
  isActive: boolean
  hasSubmenu: boolean
  onTopLevelClick: (route: Route) => void
  onCloseSheet?: () => void
}

export function TopLevelRouteItem({
  route,
  isActive,
  hasSubmenu,
  onTopLevelClick,
  onCloseSheet,
}: TopLevelRouteItemProps) {
  const hasItems = hasSubmenu && !isDirectLinkAtTopLevel(route)
  const content = (
    <>
      {route.icon && (
        <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0">
          {route.icon}
        </span>
      )}
      <span className="truncate">{route.label}</span>
    </>
  )
  const menuButtonClass = cn(
    sidebarMenuButtonVariants({ size: 'default', hasIcon: !!route.icon }),
    route.disabled && 'opacity-50 pointer-events-none'
  )

  return (
    <SidebarMenuItem key={route.key}>
      {hasItems ? (
        <button
          type="button"
          data-active={isActive}
          onClick={() => onTopLevelClick(route)}
          disabled={route.disabled}
          className={menuButtonClass}
        >
          {content}
        </button>
      ) : route.link ? (
        <Link
          href={route.link}
          onClick={onCloseSheet}
          data-active={isActive}
          className={menuButtonClass}
        >
          {content}
        </Link>
      ) : (
        <span data-active={false} className={cn(menuButtonClass, 'cursor-default')}>
          {content}
        </span>
      )}
    </SidebarMenuItem>
  )
}
