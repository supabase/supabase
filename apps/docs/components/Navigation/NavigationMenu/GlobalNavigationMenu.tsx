import Link from 'next/link'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Badge,
  cn,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from 'ui'

import HomeMenuIconPicker from './HomeMenuIconPicker'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'

const GlobalMenubar = () => {
  return (
    <div className="h-[30px] px-5 lg:px-10 flex relative top-0 gap-2 justify-start overflow-x-scroll no-scrollbar lg:items-end w-full">
      <Menubar className="border-none">
        {GLOBAL_MENU_ITEMS.map((section, sectionIndex) =>
          section[0].menuItems ? (
            <MenubarMenu>
              <MenubarTrigger className="inline-flex items-center justify-center rounded-md bg-transparent font-normal text-foreground-lighter hover:text-brand-link data-[state=open]:!text-brand-link transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none bg-background hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50 data-[active]:bg-accent/50 h-10 group w-max group">
                {section[0].label}
                <ChevronDown
                  className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </MenubarTrigger>
              <MenubarContent className="!top-[calc(100%+4px)] z-50 min-w-[14rem] overflow-hidden rounded-md border border-overlay bg-overlay p-1 text-foreground-light shadow-md !duration-0 w-64">
                {section[0].menuItems?.map((menuItem, menuItemIndex) => (
                  <>
                    {menuItemIndex !== 0 && <MenubarSeparator />}
                    {menuItem.map((item) =>
                      !item.href ? (
                        <div className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md p-2 leading-none">
                          {item.label}{' '}
                        </div>
                      ) : (
                        <MenubarItem className="text-sm relative" key={section[0].label}>
                          <MenuItem
                            href={item.href}
                            title={item.label}
                            community={item.community}
                            icon={item.icon}
                          />
                        </MenubarItem>
                      )
                    )}
                  </>
                ))}
              </MenubarContent>
            </MenubarMenu>
          ) : (
            <MenuItem
              href={section[0].href}
              title={section[0].label}
              className={cn(
                'group-hover:bg-transparent text-foreground-lighter focus-visible:text-brand-link',
                sectionIndex === 0 && 'pl-0'
              )}
            />
          )
        )}
      </Menubar>
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

export default GlobalMenubar
