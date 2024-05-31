import React, { Fragment } from 'react'
import Link from 'next/link'
import {
  cn,
  MenubarSeparator,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui'

import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'
import { MenuItem } from './GlobalNavigationMenu'
import HomeMenuIconPicker from './HomeMenuIconPicker'

const GlobalNavigationMenuDesktop = () => (
  <NavigationMenu
    delayDuration={0}
    skipDelayDuration={0}
    className="hidden space-x-4 z-50 lg:flex justify-start px-5 lg:px-10"
    hasViewport={false}
    orientation="vertical"
  >
    <NavigationMenuList>
      {GLOBAL_MENU_ITEMS.map((section, sectionIndex) =>
        section[0].menuItems ? (
          <NavigationMenuItem
            key={`desktop-docs-menu-section-${section[0].label}`}
            className="text-sm relative"
          >
            <NavigationMenuTrigger className="bg-transparent font-normal text-foreground-lighter hover:text-foreground data-[state=open]:!text-foreground data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground p-2 h-auto">
              {section[0].label === 'Home' ? (
                <HomeMenuIconPicker icon={section[0].icon} />
              ) : (
                section[0].label
              )}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="!top-[calc(100%+4px)] z-50 min-w-[14rem] overflow-hidden rounded-md border border-overlay bg-overlay p-1 text-foreground-light shadow-md !duration-0 w-64">
              {section[0].menuItems?.map((menuItem, menuItemIndex) => (
                <Fragment key={`desktop-docs-menu-section-${menuItemIndex}`}>
                  {menuItemIndex !== 0 && <MenubarSeparator />}
                  {menuItem.map((item) =>
                    !item.href ? (
                      <div className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md p-2 leading-none">
                        {item.label}
                      </div>
                    ) : (
                      <NavigationMenuLink asChild>
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
            </NavigationMenuContent>
          </NavigationMenuItem>
        ) : (
          <NavigationMenuItem
            key={`desktop-docs-menu-section-${section[0].label}`}
            className="text-sm"
          >
            <NavigationMenuLink asChild>
              <Link
                href={section[0].href}
                className={cn(
                  'flex-1 whitespace-nowrap flex items-center text-foreground-lighter text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
                  sectionIndex === 0 && 'pl-0'
                )}
              >
                {section[0].label === 'Home' ? (
                  <HomeMenuIconPicker icon={section[0].icon} />
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
)

GlobalNavigationMenuDesktop.displayName = 'GlobalNavigationMenuDesktop'

export default GlobalNavigationMenuDesktop
