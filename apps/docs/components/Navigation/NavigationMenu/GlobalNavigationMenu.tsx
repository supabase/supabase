'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { FC, useEffect, useState } from 'react'
import { Badge, cn } from 'ui'
import {
  TopNavMenu,
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuItem,
  TopNavMenuLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

import type { DropdownMenuItem, GlobalMenuItems } from '../Navigation.types'
import MenuIconPicker from './MenuIconPicker'
import { IA_NAV_PENDING_CLASS, useIaNavReady, useNavItems } from '@/features/IaNav'

/**
 * Get TopNav active label based on current pathname
 */
export const useActiveMenuLabel = (menu: GlobalMenuItems) => {
  const pathname = usePathname()
  const [activeLabel, setActiveLabel] = useState('')

  useEffect(() => {
    // check if homepage
    if (pathname === '/') {
      return setActiveLabel('Home')
    }

    for (let index = 0; index < menu.length; index++) {
      const section = menu[index]
      if (section[0].enabled === false) continue

      // check if first level menu items match beginning of url
      if (section[0].href?.startsWith(pathname)) {
        return setActiveLabel(section[0].label)
      }
      // check if second level menu items match beginning of url
      if (section[0].menuItems) {
        section[0].menuItems.map((menuItemGroup) =>
          menuItemGroup
            .filter((menuItem) => menuItem.enabled !== false)
            .map(
              (menuItem) => menuItem.href?.startsWith(pathname) && setActiveLabel(section[0].label)
            )
        )
      }
    }
  }, [pathname, menu])

  return activeLabel
}

const GlobalNavigationMenu: FC = () => {
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  const isNavReady = useIaNavReady()
  const activeLabel = useActiveMenuLabel(GLOBAL_MENU_ITEMS)
  const itemClassName = cn(!isNavReady && IA_NAV_PENDING_CLASS)

  return (
    <TopNavMenu className="ml-3.5">
      {GLOBAL_MENU_ITEMS.filter(([section]) => section.enabled !== false).map(([section]) => {
        const label =
          section.label === 'Home' ? <MenuIconPicker icon={section.icon || ''} /> : section.label
        const ariaCurrent = activeLabel === section.label ? 'true' : undefined

        return section.menuItems ? (
          <TopNavMenuItem
            key={section.label}
            label={label}
            aria-current={ariaCurrent}
            className={itemClassName}
          >
            <TopNavMenuPanel className="pr-5 pl-[calc(var(--nav-logo-width)+4.75rem)]">
              {section.menuItems.map((group, index) => (
                <GlobalMenuGroup
                  key={group[0].label}
                  items={group}
                  fallbackLabel={index === 0 ? section.label : undefined}
                />
              ))}
            </TopNavMenuPanel>
          </TopNavMenuItem>
        ) : (
          <TopNavMenuLink
            key={section.label}
            linkAs={Link}
            href={section.href || '#'}
            aria-current={ariaCurrent}
            className={itemClassName}
          >
            {label}
          </TopNavMenuLink>
        )
      })}
    </TopNavMenu>
  )
}

// an item without a link is the heading of its group. the first group falls back to the menu name
const GlobalMenuGroup = ({
  items,
  fallbackLabel,
}: {
  items: DropdownMenuItem[]
  fallbackLabel?: string
}) => {
  const enabledItems = items.filter((item) => item.enabled !== false)

  return (
    <TopNavMenuGroup label={enabledItems.find((item) => !item.href)?.label ?? fallbackLabel}>
      {enabledItems
        .filter((item) => item.href)
        .map((item) => (
          <TopNavMenuGroupLink key={item.href} linkAs={Link} href={item.href}>
            {item.label}
            {item.community ? <Badge>Community</Badge> : null}
            {item.new ? <Badge variant="success">New</Badge> : null}
            {item.experimental ? <Badge variant="warning">Experimental</Badge> : null}
          </TopNavMenuGroupLink>
        ))}
    </TopNavMenuGroup>
  )
}

export const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    icon?: string
    community?: boolean
    new?: boolean
    experimental?: boolean
  }
>(
  (
    { className, title, href = '', icon, community, new: isNew, experimental, children, ...props },
    ref
  ) => {
    return (
      <Link
        href={href}
        ref={ref}
        className={cn(
          'group/menu-item flex items-center gap-2',
          'w-full flex h-8 items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline focus-ring focus-visible:text-foreground',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && <MenuIconPicker icon={icon} className="text-foreground-lighter" />}
            <span className="flex-1">{title}</span>
            {community && <Badge>Community</Badge>}
            {isNew && <Badge variant="success">New</Badge>}
            {experimental && <Badge variant="warning">Experimental</Badge>}
          </>
        )}
      </Link>
    )
  }
)

GlobalNavigationMenu.displayName = 'GlobalNavigationMenu'
MenuItem.displayName = 'MenuItem'

export default GlobalNavigationMenu
