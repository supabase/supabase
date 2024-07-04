'use client'

import React, { FC, Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Badge,
  cn,
  MenubarSeparator,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from 'ui'

import MenuIconPicker from './MenuIconPicker'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'

/**
 * Get TopNav active label based on current pathname
 */
export const useActiveMenuLabel = (GLOBAL_MENU_ITEMS) => {
  const pathname = usePathname()
  const [activeLabel, setActiveLabel] = useState('')

  useEffect(() => {
    // check if homepage
    if (pathname === '/') {
      return setActiveLabel('Home')
    }

    for (let index = 0; index < GLOBAL_MENU_ITEMS.length; index++) {
      const section = GLOBAL_MENU_ITEMS[index]
      // check if first level menu items match beginning of url
      if (section[0].href?.startsWith(pathname)) {
        return setActiveLabel(section[0].label)
      }
      // check if second level menu items match beginning of url
      if (section[0].menuItems) {
        section[0].menuItems.map((menuItemGroup) =>
          menuItemGroup.map(
            (menuItem) => menuItem.href?.startsWith(pathname) && setActiveLabel(section[0].label)
          )
        )
      }
    }
  }, [pathname])

  return activeLabel
}

const GlobalNavigationMenu: FC = () => {
  const activeLabel = useActiveMenuLabel(GLOBAL_MENU_ITEMS)
  const triggerClassName =
    'h-[var(--header-height)] p-2 bg-transparent border-0 border-b-2 border-transparent font-normal rounded-none text-foreground-light hover:text-foreground data-[state=open]:!text-foreground data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground h-full focus-visible:rounded !shadow-none outline-none transition-all outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600'

  return (
    <div className="flex relative gap-2 justify-start items-end w-full h-full">
      <NavigationMenu
        delayDuration={0}
        skipDelayDuration={0}
        className="w-full flex justify-start h-full"
        renderViewport={false}
        viewportClassName="mt-0 max-w-screen overflow-hidden border-0 rounded-none mt-1.5 rounded-md !border-x"
      >
        <NavigationMenuList className="px-6 space-x-2 h-[var(--header-height)]">
          {GLOBAL_MENU_ITEMS.map((section, sectionIdx) =>
            section[0].menuItems ? (
              <NavigationMenuItem
                key={`desktop-docs-menu-section-${section[0].label}-${sectionIdx}`}
                className="text-sm relative h-full"
              >
                <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    triggerClassName,
                    activeLabel === section[0].label && 'text-foreground border-foreground'
                  )}
                >
                  {section[0].label === 'Home' ? (
                    <MenuIconPicker icon={section[0].icon} />
                  ) : (
                    section[0].label
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!top-[calc(100%+4px)] min-w-[14rem] max-h-[calc(100vh-4rem)] border-y w-screen md:w-64 overflow-hidden overflow-y-auto rounded-none md:rounded-md md:border border-overlay bg-overlay text-foreground-light shadow-md !duration-0">
                  <div className="p-3 md:p-1">
                    {section[0].menuItems?.map((menuItem, menuItemIndex) => (
                      <Fragment key={`desktop-docs-menu-section-${menuItemIndex}-${menuItemIndex}`}>
                        {menuItemIndex !== 0 && <MenubarSeparator className="bg-border-muted" />}
                        {menuItem.map((item, itemIdx) =>
                          !item.href ? (
                            <div
                              key={`desktop-docs-menu-section-label-${item.label}-${itemIdx}`}
                              className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md p-2 leading-none"
                            >
                              {item.label}
                            </div>
                          ) : (
                            <NavigationMenuLink
                              key={`desktop-docs-menu-section-label-${item.label}-${itemIdx}`}
                              asChild
                            >
                              <MenuItem
                                href={item.href}
                                title={item.label}
                                community={item.community}
                                icon={item.icon}
                              />
                            </NavigationMenuLink>
                          )
                        )}
                      </Fragment>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem
                key={`desktop-docs-menu-section-${section[0].label}-${sectionIdx}`}
                className="text-sm relative h-full"
              >
                <NavigationMenuLink asChild>
                  <Link
                    href={section[0].href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      triggerClassName,
                      activeLabel === section[0].label && 'text-foreground border-foreground'
                    )}
                  >
                    {section[0].label === 'Home' ? (
                      <MenuIconPicker icon={section[0].icon} />
                    ) : (
                      section[0].label
                    )}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    icon?: string
    community?: boolean
  }
>(({ className, title, href = '', icon, community, children, ...props }, ref) => {
  return (
    <Link
      href={href}
      ref={ref}
      className={cn(
        'group/menu-item flex items-center gap-2',
        'w-full flex h-8 items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline !outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && <MenuIconPicker icon={icon} className="text-foreground-lighter" />}
          <span className="flex-1">{title}</span>
          {community && <Badge size="small">Community</Badge>}
        </>
      )}
    </Link>
  )
})

GlobalNavigationMenu.displayName = 'GlobalNavigationMenu'
MenuItem.displayName = 'MenuItem'

export default GlobalNavigationMenu
