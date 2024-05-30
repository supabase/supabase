import React, { Fragment } from 'react'
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
            <NavigationMenuTrigger className="bg-transparent font-normal text-foreground-lighter hover:text-brand-link data-[state=open]:!text-brand-link data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground p-2 h-auto">
              {section[0].label}
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
              <MenuItem
                href={section[0].href}
                title={section[0].label}
                className={cn(
                  'group-hover:bg-transparent text-foreground-lighter focus-visible:text-brand-link',
                  sectionIndex === 0 && 'pl-0'
                )}
              />
            </NavigationMenuLink>
          </NavigationMenuItem>
        )
      )}
    </NavigationMenuList>
  </NavigationMenu>
)

export default GlobalNavigationMenuDesktop
