import React, { Fragment } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  cn,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from 'ui'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'
import { MenuItem } from './GlobalNavigationMenu'

const GlobalNavigationMenuMobile = () => (
  <div className="flex overflow-x-scroll no-scrollbar ">
    <Menubar className="z-50 space-x-0 flex lg:hidden border-none justify-start px-5">
      {GLOBAL_MENU_ITEMS.map((section, sectionIndex) =>
        section[0].menuItems ? (
          <MenubarMenu key={`mobile-docs-menu-section-${section[0].label}`}>
            <MenubarTrigger className="bg-transparent whitespace-nowrap font-normal text-foreground-lighter hover:text-brand-link inline-flex items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none bg-background hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50 data-[active]:bg-accent/50 h-10 py-2 px-2 group w-max">
              {section[0].label}{' '}
              <ChevronDown
                className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </MenubarTrigger>
            <MenubarContent
              sideOffset={4}
              className="z-50 right-5 mx-2 min-w-[14rem] overflow-hidden rounded-md border border-overlay bg-overlay p-1 text-foreground-light shadow-md !duration-0 w-64"
            >
              {section[0].menuItems?.map((menuItem, menuItemIndex) => (
                <Fragment key={`mobile-docs-menu-section-${menuItemIndex}`}>
                  {menuItemIndex !== 0 && <MenubarSeparator />}
                  {menuItem.map((item) =>
                    !item.href ? (
                      <div className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md p-2 leading-none">
                        {item.label}
                      </div>
                    ) : (
                      <MenubarItem className="text-sm relative p-0">
                        <MenuItem
                          href={item.href}
                          title={item.label}
                          community={item.community}
                          icon={item.icon}
                        />
                      </MenubarItem>
                    )
                  )}
                </Fragment>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ) : (
          <MenuItem
            key={`mobile-docs-menu-section-${section[0].label}`}
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

export default GlobalNavigationMenuMobile
