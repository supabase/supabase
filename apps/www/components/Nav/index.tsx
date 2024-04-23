import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { useWindowSize } from 'react-use'

import { Announcement, Button, cn, LW11CountdownBanner } from 'ui'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui/src/components/shadcn/ui/navigation-menu'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import ScrollProgress from '~/components/ScrollProgress'
import GitHubButton from './GitHubButton'
import HamburgerButton from './HamburgerMenu'
import MobileMenu from './MobileMenu'
import MenuItem from './MenuItem'
import { menu } from '~/data/nav'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

interface Props {
  hideNavbar: boolean
}

const Nav = (props: Props) => {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const { width } = useWindowSize()
  const [open, setOpen] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()

  const isHomePage = router.pathname === '/'
  const isGAWeekSection = router.pathname.includes('/ga-week')
  const isLaunchWeekPage = router.pathname.includes('launch-week') || isGAWeekSection
  const isLaunchWeekXPage = router.pathname === '/launch-week/x'
  const isLaunchWeek11Page = router.pathname === '/ga-week'
  const showLaunchWeekNavMode = (isLaunchWeekPage || isLaunchWeek11Page) && !open

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

  if (props.hideNavbar) {
    return null
  }

  const showDarkLogo = isLaunchWeekPage || resolvedTheme?.includes('dark')! || isHomePage

  return (
    <>
      <Announcement>
        <LW11CountdownBanner />
      </Announcement>
      <div
        className={cn(
          'sticky top-0 z-40 transform',
          (isLaunchWeekXPage || isLaunchWeek11Page) && 'relative'
        )}
        style={{ transform: 'translate3d(0,0,999px)' }}
      >
        <div
          className={cn(
            'absolute inset-0 h-full w-full opacity-80 bg-background',
            !showLaunchWeekNavMode && '!opacity-100 transition-opacity',
            showLaunchWeekNavMode && '!bg-transparent transition-all',
            isGAWeekSection && 'dark:!bg-alternative'
          )}
        />
        <nav
          className={cn(
            `relative z-40 border-default border-b backdrop-blur-sm transition-opacity`,
            showLaunchWeekNavMode ? '!opacity-100 !border-[#e0d2f430]' : '',
            isLaunchWeekPage && showLaunchWeekNavMode ? '!border-b-0' : ''
          )}
        >
          <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-16 xl:px-20">
            <div className="flex items-center px-6 lg:px-0 flex-1 sm:items-stretch justify-between">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  <Link
                    href="/"
                    className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
                  >
                    <Image
                      src={supabaseLogoWordmarkLight}
                      width={124}
                      height={24}
                      alt="Supabase Logo"
                      className="dark:hidden"
                      priority
                    />
                    <Image
                      src={supabaseLogoWordmarkDark}
                      width={124}
                      height={24}
                      alt="Supabase Logo"
                      className="hidden dark:block"
                      priority
                    />
                  </Link>

                  {!isGAWeekSection &&
                    !isLaunchWeek11Page &&
                    isLaunchWeekPage &&
                    !isLaunchWeekXPage && (
                      <Link
                        href="/launch-week"
                        as="/launch-week"
                        className="hidden ml-2 xl:block font-mono text-sm uppercase leading-4 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
                      >
                        Launch Week
                      </Link>
                    )}
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
                          <NavigationMenuTrigger className="bg-transparent text-foreground hover:text-brand-link data-[state=open]:!text-brand-link data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground p-2 h-auto">
                            {menuItem.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent
                            className={cn('rounded-xl', menuItem.dropdownContainerClassName)}
                          >
                            {menuItem.dropdown}
                          </NavigationMenuContent>
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
                      <Button className="hidden text-white lg:block" asChild>
                        <Link href="/dashboard/projects">Dashboard</Link>
                      </Button>
                    ) : (
                      <>
                        <Button type="default" className="hidden lg:block" asChild>
                          <Link href="https://supabase.com/dashboard">Sign in</Link>
                        </Button>
                        <Button className="hidden text-white lg:block" asChild>
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
          <MobileMenu open={open} setOpen={setOpen} isDarkMode={showDarkLogo} menu={menu} />
        </nav>

        <ScrollProgress />
      </div>
    </>
  )
}

export default Nav
