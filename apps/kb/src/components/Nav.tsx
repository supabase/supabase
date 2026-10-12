import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  buttonVariants,
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'ui'

import { NAV_MENUS, type NavMenu } from '../lib/nav'

export interface NavProps {
  className?: string
}

interface MenuPanelProps {
  menu: NavMenu
}

const MENU_LABELS = NAV_MENUS.map((menu) => menu.label)
const TWO_COLUMN_MIN_LINKS = 7

export const Nav = ({ className }: NavProps) => {
  const [activeMenu, setActiveMenu] = useState('')
  const [visibleMenu, setVisibleMenu] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)

  // the card only animates its size when moving between two open menus
  const handleMenuChange = (value: string) => {
    setIsSwitching(value !== '' && activeMenu !== '')
    setActiveMenu(value)
    if (value !== '') setVisibleMenu(value)
  }

  const sideOf = (label: string) => {
    if (label === visibleMenu) return 'active'
    return MENU_LABELS.indexOf(label) < MENU_LABELS.indexOf(visibleMenu) ? 'start' : 'end'
  }

  return (
    <NavigationMenu
      delayDuration={0}
      value={activeMenu}
      onValueChange={handleMenuChange}
      renderViewport={false}
      className={cn('relative h-full items-stretch', className)}
    >
      <NavigationMenuList className="h-full items-stretch space-x-0">
        {NAV_MENUS.map((menu) => (
          <NavigationMenuItem key={menu.label} value={menu.label} className="text-sm font-medium">
            <NavigationMenuTrigger
              className={cn(
                buttonVariants({ variant: 'text', size: 'small' }),
                'h-full bg-transparent! px-2.5 hover:text-primary data-open:text-primary!',
                'focus-ring focus-visible:text-foreground'
              )}
            >
              {menu.label}
            </NavigationMenuTrigger>
            <NavigationMenuContent
              forceMount
              inert={visibleMenu !== menu.label}
              data-active={visibleMenu === menu.label}
              data-side={sideOf(menu.label)}
              className={cn(
                'data-[motion^=from-]:animate-none! data-[motion^=to-]:animate-none!',
                'data-[active=false]:pointer-events-none data-[active=false]:opacity-0',
                'data-[side=start]:-translate-x-4 data-[side=end]:translate-x-4',
                'motion-safe:group-data-[switching=true]/viewport:transition-[opacity,translate]',
                'motion-safe:group-data-[switching=true]/viewport:duration-250',
                'motion-safe:group-data-[switching=true]/viewport:ease-in-out'
              )}
            >
              <MenuPanel menu={menu} />
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      <NavigationMenuViewport
        forceMount
        data-open={activeMenu !== ''}
        data-switching={isSwitching}
        containerProps={{ className: '-left-3.5 justify-start pointer-events-none' }}
        className={cn(
          'group/viewport pointer-events-auto origin-top-left scale-100 rounded-xl bg-surface-75',
          'data-[state=open]:animate-none! data-[state=closed]:animate-none!',
          'data-[state=open]:duration-200 data-[state=open]:ease-out data-[state=closed]:duration-200',
          'data-[open=false]:pointer-events-none data-[open=false]:invisible',
          'data-[open=false]:scale-[0.97] data-[open=false]:opacity-0',
          'motion-safe:transition-[opacity,scale,visibility]',
          'motion-safe:data-[switching=true]:transition-[width,height,opacity,scale,visibility]',
          'motion-reduce:transition-none'
        )}
      />
    </NavigationMenu>
  )
}

const MenuPanel = ({ menu }: MenuPanelProps) => (
  <div className="flex flex-col gap-6 px-6 py-5">
    <span className="font-mono text-xs uppercase tracking-widest text-foreground-lighter">
      {menu.label}
    </span>
    <ul
      className={cn(
        'grid gap-x-10 gap-y-4',
        menu.links.length >= TWO_COLUMN_MIN_LINKS ? 'w-md grid-cols-2' : 'w-48'
      )}
    >
      {menu.links.map((link) => (
        <li key={link.href}>
          <NavigationMenuLink asChild>
            <a
              href={link.href}
              className={cn(
                'group flex items-center gap-2 rounded-sm text-sm text-foreground-light',
                'hover:text-foreground focus-ring focus-visible:text-foreground'
              )}
            >
              {link.label}
              <ChevronRight
                strokeWidth={2}
                className={cn(
                  '-ml-1 w-3 -translate-x-1 opacity-0 transition-all',
                  'group-hover:translate-x-0 group-hover:opacity-100'
                )}
              />
            </a>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  </div>
)
