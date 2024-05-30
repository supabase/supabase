import Link from 'next/link'
import React from 'react'
import {
  Badge,
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'
import HomeMenuIconPicker from './HomeMenuIconPicker'

const GlobalNavigationMenu = () => {
  return (
    <div className="h-[30px] px-5 lg:px-10 flex relative top-0 gap-2 justify-start overflow-x-scroll no-scrollbar lg:items-end w-full">
      <NavigationMenu
        delayDuration={0}
        skipDelayDuration={0}
        className="gap-2 sm:gap-4 flex justify-start"
        hasViewport={false}
        orientation="vertical"
      >
        <NavigationMenuList>
          {GLOBAL_MENU_ITEMS.map((section, sectionIndex) =>
            section[0].menuItems ? (
              <NavigationMenuItem className="text-sm relative" key={section[0].label}>
                <NavigationMenuTrigger className="bg-transparent font-normal text-foreground-lighter hover:text-brand-link data-[state=open]:!text-brand-link data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground p-2 h-auto">
                  {section[0].label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!top-[calc(100%+4px)] z-50 min-w-[14rem] overflow-hidden rounded-md border border-overlay bg-overlay p-1 text-foreground-light shadow-md !duration-0 w-64">
                  {section[0].menuItems?.map((menuItem) =>
                    menuItem.map((item) =>
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
                    )
                  )}
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem
                className="text-sm whitespace-nowrap text-nowrap flex-nowrap"
                key={section[0].label}
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
    </div>
  )
}

const MenuItem = React.forwardRef<
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
        'group/menu-item flex items-center gap-2 whitespace-nowrap text-nowrap flex-nowrap',
        'flex items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
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

export default GlobalNavigationMenu
