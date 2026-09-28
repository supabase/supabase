'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Badge, cn } from 'ui'

import MenuIconPicker from './MenuIconPicker'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'

/**
 * Get TopNav active label based on current pathname
 */
export const useActiveMenuLabel = (menu: typeof GLOBAL_MENU_ITEMS) => {
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

export const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    icon?: string
    community?: boolean
    new?: boolean
  }
>(({ className, title, href = '', icon, community, new: isNew, children, ...props }, ref) => {
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
        </>
      )}
    </Link>
  )
})

MenuItem.displayName = 'MenuItem'
