import React, { Fragment } from 'react'
import Link from 'next/link'
import { useBreakpoint } from 'common'
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
  NavigationMenuViewport,
  ScrollArea,
  ScrollBar,
} from 'ui'

import HomeMenuIconPicker from './HomeMenuIconPicker'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'

const GlobalNavigationMenu = () => {
  const isTablet = useBreakpoint('md')

  const ResponsiveScrollArea = ({ children }) =>
    !isTablet ? (
      <>{children}</>
    ) : (
      <>
        <ScrollArea>
          {children}
          <ScrollBar orientation="horizontal" className="hidden" />
          <NavigationMenuViewport containerProps={{ className: 'bg-transparent' }} />
        </ScrollArea>
      </>
    )

  return (
    <NavigationMenu
      delayDuration={0}
      skipDelayDuration={0}
      className="w-full space-x-4 flex justify-start"
      renderViewport={isTablet}
      orientation="horizontal"
    >
      <ResponsiveScrollArea>
        <NavigationMenuList className="px-5 lg:px-10">
          {GLOBAL_MENU_ITEMS.map((section, sectionIndex) =>
            section[0].menuItems ? (
              <NavigationMenuItem
                key={`desktop-docs-menu-section-${section[0].label}`}
                className="text-sm relative"
              >
                <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    'bg-transparent font-normal text-foreground-lighter hover:text-foreground data-[state=open]:!text-foreground data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground p-2 h-auto'
                  )}
                >
                  {section[0].label === 'Home' ? (
                    <HomeMenuIconPicker icon={section[0].icon} />
                  ) : (
                    section[0].label
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!top-[calc(100%+4px)] min-w-[14rem] w-[calc(100vw-2rem)] md:w-64 overflow-hidden rounded-md lg:border border-overlay bg-overlay p-1 text-foreground-light shadow-md !duration-0">
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
                      sectionIndex === 0 && '-ml-2'
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
      </ResponsiveScrollArea>
    </NavigationMenu>
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
        'w-full flex items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && <HomeMenuIconPicker icon={icon} />}
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
