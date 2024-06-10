import React, { FC, Fragment, PropsWithChildren, useEffect, useState } from 'react'
import { useBreakpoint } from 'common'
import Link from 'next/link'
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
import { usePathname } from 'next/navigation'

/**
 * Get TopNav active label based on current pathname
 */
const useActiveMenuLabel = () => {
  const pathname = usePathname()
  const [activeLabel, setActiveLabel] = useState('')

  useEffect(() => {
    GLOBAL_MENU_ITEMS.map((section) => {
      // check if homepage
      if (pathname === '/') {
        return setActiveLabel('Home')
      }
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
    })
  }, [pathname])

  return activeLabel
}

const GlobalNavigationMenu: FC = () => {
  const isLowerThanMd = useBreakpoint('md')
  const activeLabel = useActiveMenuLabel()
  const triggerClassName =
    'bg-transparent border-0 border-b-2 border-transparent font-normal rounded-none text-foreground-lighter hover:text-foreground data-[state=open]:!text-foreground data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground py-2 px-0 h-full focus-visible:rounded !shadow-none outline-none transition-all outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600'

  return (
    <div className="hidden lg:flex relative gap-2 justify-start items-end w-full">
      <NavigationMenu
        delayDuration={0}
        skipDelayDuration={0}
        className="w-full flex justify-start"
        renderViewport={isLowerThanMd}
        viewportClassName="mt-0 max-w-screen overflow-hidden border-0 rounded-none lg:mt-1.5 lg:rounded-md lg:!border-x"
        orientation="horizontal"
      >
        <ResponsiveScrollArea isLowerThanMd={isLowerThanMd}>
          <NavigationMenuList className="px-5 lg:px-10 space-x-5 lg:space-x-6 h-[37px]">
            {GLOBAL_MENU_ITEMS.map((section) =>
              section[0].menuItems ? (
                <NavigationMenuItem
                  key={`desktop-docs-menu-section-${section[0].label}`}
                  className="text-sm relative"
                >
                  <NavigationMenuTrigger
                    className={cn(
                      navigationMenuTriggerStyle(),
                      triggerClassName,
                      activeLabel === section[0].label && 'text-foreground border-foreground'
                    )}
                  >
                    {section[0].label === 'Home' ? (
                      <HomeMenuIconPicker icon={section[0].icon} />
                    ) : (
                      section[0].label
                    )}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!top-[calc(100%+4px)] min-w-[14rem] border-y w-screen md:w-64 overflow-hidden rounded-none md:rounded-md md:border border-overlay bg-overlay p-3 md:p-1 text-foreground-light shadow-md !duration-0">
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
    </div>
  )
}

const ResponsiveScrollArea: FC<PropsWithChildren<{ isLowerThanMd: boolean }>> = ({
  isLowerThanMd,
  children,
}) =>
  !isLowerThanMd ? (
    <>{children}</>
  ) : (
    <>
      <ScrollArea className="relative">
        <div className="absolute h-full right-0 w-7 z-50 bg-gradient-to-r from-transparent to-background" />
        {children}
        <ScrollBar orientation="horizontal" className="hidden" />
        <NavigationMenuViewport containerProps={{ className: 'overflow-hidden' }} />
      </ScrollArea>
    </>
  )

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
        'w-full flex items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 py-2.5 lg:py-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && <HomeMenuIconPicker icon={icon} className="text-foreground-lighter" />}
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
