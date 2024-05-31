import React from 'react'
import Link from 'next/link'
import { Badge, cn } from 'ui'
import { useBreakpoint } from 'common'

import HomeMenuIconPicker from './HomeMenuIconPicker'
import GlobalNavigationMenuDesktop from './GlobalNavigationMenuDesktop'
import GlobalNavigationMenuMobile from './GlobalNavigationMenuMobile'

const GlobalNavigationMenu = () => {
  const isTablet = useBreakpoint()

  return (
    <nav className="h-[30px] flex relative gap-2 justify-start items-end w-full">
      {!isTablet ? <GlobalNavigationMenuDesktop /> : <GlobalNavigationMenuMobile />}
    </nav>
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
        'flex items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && <HomeMenuIconPicker icon={icon} />}
          {title}
          {community && <Badge size="small">Community</Badge>}
        </>
      )}
    </Link>
  )
})

GlobalNavigationMenu.displayName = 'GlobalNavigationMenu'
MenuItem.displayName = 'MenuItem'

export default GlobalNavigationMenu
