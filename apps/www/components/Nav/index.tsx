import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useWindowSize } from 'react-use'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Announcement, Button, buttonVariants, cn } from 'ui'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui/src/components/shadcn/ui/navigation-menu'
import LW13CountdownBanner from 'ui/src/layout/banners/LW13CountdownBanner/LW13CountdownBanner'

import ScrollProgress from '~/components/ScrollProgress'
import { getMenu } from '~/data/nav'
import GitHubButton from './GitHubButton'
import HamburgerButton from './HamburgerMenu'
import MenuItem from './MenuItem'
import MobileMenu from './MobileMenu'
import RightClickBrandLogo from './RightClickBrandLogo'

interface Props {
  hideNavbar: boolean
  stickyNavbar?: boolean
}

const Nav = ({ hideNavbar, stickyNavbar = true }: Props) => {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const { width } = useWindowSize()
  const [open, setOpen] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const menu = getMenu()

  const isHomePage = router.pathname === '/'
  const isLaunchWeekPage = router.pathname.includes('/launch-week')
  const isLaunchWeekXPage = router.pathname === '/launch-week/x'
  const isGAWeekSection = router.pathname.startsWith('/ga-week')
  const disableStickyNav = isLaunchWeekXPage || isGAWeekSection || isLaunchWeekPage || !stickyNavbar
  const showLaunchWeekNavMode = (isLaunchWeekPage || isGAWeekSection) && !open

  React.useEffect(() => {
    if (open) {
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [open])

  // Close mobile menu when desktop
  React.useEffect(() => {
    if (width >= 1024) setOpen(false)
  }, [width])

  if (hideNavbar) {
    return null
  }

  const showDarkLogo = isLaunchWeekPage || resolvedTheme?.includes('dark')! || isHomePage

  return (
    <>
      <div
        className={cn('sticky top-0 z-40 transform', disableStickyNav && 'relative')}
        style={{ transform: 'translate3d(0,0,999px)' }}
      >
        <div
          className={cn(
            'absolute inset-0 h-full w-full bg-background/90 dark:bg-background/95',
            !showLaunchWeekNavMode && '!opacity-100 transition-opacity',
            showLaunchWeekNavMode && '!bg-transparent transition-all',
            isGAWeekSection && 'dark:!bg-alternative'
          )}
        />
        <nav
          className={cn(
            `relative z-40 border-default border-b backdrop-blur-sm transition-opacity`,
            showLaunchWeekNavMode && 'border-muted border-b bg-alternative/50'
          )}
        >
          <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-16 xl:px-20">
            <div className="flex items-center px-6 lg:px-0 flex-1 sm:items-stretch justify-between">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  <RightClickBrandLogo />
                </div>
                <NavigationMenu
                  delayDuration={0}
                  className="hidden pl-8 sm:space-x-4 lg:flex h-16"
                  viewportClassName="rounded-xl bg-background"
                >
                  <NavigationMenuList>
                    {menu.primaryNav.map((menuItem) =>
                      menuItem.hasDropdown ? (
                        <NavigationMenuItem className="text-sm font-medium" key={menuItem.title}>
                          <NavigationMenuTrigger
                            className={cn(
                              buttonVariants({ type: 'text', size: 'small' }),
                              '!bg-transparent hover:text-brand-link data-[state=open]:!text-brand-link data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground px-2 h-auto'
                            )}
                          >
                            {menuItem.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>{menuItem.dropdown}</NavigationMenuContent>
                        </NavigationMenuItem>
                      ) : (
                        <NavigationMenuItem className="text-sm font-medium" key={menuItem.title}>
                          <NavigationMenuLink asChild>
                            <MenuItem
                              href={menuItem.url}
                              title={menuItem.title}
                              className="group-hover:bg-transparent text-foreground focus-visible:text-brand-link"
                              hoverColor="brand"
                            />
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )
                    )}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
              <div className="flex items-center gap-2 opacity-0 animate-fade-in !scale-100 delay-300">
                <GitHubButton />
                {!isUserLoading && (
                  <>
                    {isLoggedIn ? (
                      <Button className="hidden lg:block" asChild>
                        <Link href="/dashboard/projects">Dashboard</Link>
                      </Button>
                    ) : (
                      <>
                        <Button type="default" className="hidden lg:block" asChild>
                          <Link href="https://supabase.com/dashboard">Sign in</Link>
                        </Button>
                        <Button className="hidden lg:block" asChild>
                          <Link href="https://supabase.com/dashboard">Start your project</Link>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <HamburgerButton
              toggleFlyOut={() => setOpen(true)}
              showLaunchWeekNavMode={showLaunchWeekNavMode}
            />
          </div>
          <MobileMenu open={open} setOpen={setOpen} menu={menu} />
        </nav>

        <ScrollProgress />
      </div>
    </>
  )
}

export default Nav
