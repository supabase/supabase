'use client'

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import ScrollProgress from 'components/ScrollProgress'
import { getMenu } from 'data/nav'
import { DevToolbarTrigger } from 'dev-tools'
import { useSendTelemetryEvent } from 'lib/telemetry'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { useWindowSize } from 'react-use'
import { Button, buttonVariants, cn } from 'ui'
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui/src/components/shadcn/ui/navigation-menu'

import GitHubButton from './GitHubButton'
import HamburgerButton from './HamburgerMenu'
import MenuItem from './MenuItem'
import { MobileMenu } from './MobileMenu'
import styles from './Nav.module.css'
import RightClickBrandLogo from './RightClickBrandLogo'
import useDropdownMenu from './useDropdownMenu'

interface Props {
  hideNavbar: boolean
  stickyNavbar?: boolean
}

// Both constants read the --menu-* variables that Nav.module.css defines on
// styles.desktopMenu. The `!` on animate-in/out beats the base
// NavigationMenuContent's animate-fade-in, which tailwind-merge cannot dedupe
// (neither class is in its `animate` group) — so the motion-reduce animate-none
// overrides need `!` too, or they would lose to it.
// fill-mode-forwards on the exit states: Radix unmounts the outgoing panel a
// frame after animationend, and tw-animate's default fill-mode of none lets it
// pop back to full opacity for that frame.
const desktopMenuContentMotion =
  'data-[motion^=from-]:animate-in! data-[motion^=to-]:animate-out! data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-[48px]! data-[motion=from-start]:slide-in-from-left-[48px]! data-[motion=to-end]:slide-out-to-right-[48px]! data-[motion=to-start]:slide-out-to-left-[48px]! data-[motion^=from-]:duration-(--menu-motion-duration) data-[motion^=to-]:duration-(--menu-motion-duration) data-[motion^=from-]:ease-(--menu-ease-in-out-quad) data-[motion^=to-]:ease-(--menu-ease-in-out-quad) data-[motion^=from-]:will-change-[transform,opacity] data-[motion^=to-]:will-change-[transform,opacity] data-[motion^=to-]:fill-mode-forwards motion-reduce:data-[motion^=from-]:animate-none! motion-reduce:data-[motion^=to-]:animate-none!'

const desktopMenuViewportMotion =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-[98%]! data-[state=closed]:zoom-out-[98%]! data-[state=open]:slide-in-from-right-0! data-[state=open]:duration-(--menu-motion-duration) data-[state=closed]:duration-(--menu-motion-duration) data-[state=open]:ease-[ease] data-[state=closed]:fill-mode-forwards motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none'

const Nav = ({ hideNavbar, stickyNavbar = true }: Props) => {
  const pathname = usePathname()
  const { width } = useWindowSize()
  const [open, setOpen] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const user = useUser()
  const menu = getMenu()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const userMenu = useDropdownMenu(user)

  const isLaunchWeekXPage = pathname === '/launch-week/x'
  const isLaunchWeek12Page = pathname === '/launch-week/12'
  const isLaunchWeek13Page = pathname === '/launch-week/13'
  const isGAWeekSection = pathname?.startsWith('/ga-week')
  const isStateOfStartupsPage = pathname?.startsWith('/state-of-startups')
  const disableStickyNav =
    isLaunchWeekXPage ||
    isGAWeekSection ||
    isLaunchWeekXPage ||
    isLaunchWeek12Page ||
    isLaunchWeek13Page ||
    !stickyNavbar
  const showLaunchWeekNavMode = (isGAWeekSection || isLaunchWeekXPage) && !open

  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    if (!isStateOfStartupsPage) return
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isStateOfStartupsPage])

  const isTransparent = isStateOfStartupsPage && !scrolled && !open

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

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-40 transform',
          disableStickyNav && 'relative',
          isStateOfStartupsPage && 'fixed left-0 right-0'
        )}
        style={{ transform: 'translate3d(0,0,999px)' }}
        data-nav-transparent={isTransparent ? '' : undefined}
      >
        <div
          className={cn(
            'absolute inset-0 h-full w-full bg-background/90 dark:bg-background/95 transition-all duration-300',
            !showLaunchWeekNavMode && !isTransparent && 'opacity-100!',
            showLaunchWeekNavMode && 'bg-transparent! dark:bg-black!',
            isGAWeekSection && 'dark:bg-alternative!',
            isTransparent && 'bg-transparent! dark:bg-transparent! opacity-100!'
          )}
        />
        <nav
          className={cn(
            `relative z-40 border-default border-b backdrop-blur-xs transition-all duration-300`,
            showLaunchWeekNavMode && 'border-muted border-b bg-transparent',
            isTransparent && 'border-transparent backdrop-blur-none'
          )}
        >
          <div className="section-container relative flex justify-between h-16">
            <div className="flex items-center flex-1 sm:items-stretch justify-between">
              <div className="flex items-center">
                <div className="flex items-center shrink-0">
                  <RightClickBrandLogo />
                </div>
                <NavigationMenu
                  delayDuration={0}
                  className={cn('hidden pl-8 sm:space-x-4 lg:flex h-16', styles.desktopMenu)}
                  viewportClassName={cn(
                    'rounded-xl bg-background xl:w-[1040px]!',
                    styles.desktopMenuViewport,
                    desktopMenuViewportMotion
                  )}
                >
                  <NavigationMenuList>
                    {menu.primaryNav.map((menuItem) =>
                      menuItem.hasDropdown ? (
                        <NavigationMenuItem className="text-sm font-medium" key={menuItem.title}>
                          <NavigationMenuTrigger
                            className={cn(
                              buttonVariants({ variant: 'text', size: 'small' }),
                              'h-auto rounded-md bg-transparent! px-2 duration-100 ease-(--menu-ease-out-quad) hover:bg-transparent! hover:text-brand-link data-[state=open]:bg-transparent! data-[state=open]:text-brand-link! focus-ring focus-visible:text-foreground'
                            )}
                          >
                            {menuItem.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent
                            className={cn(desktopMenuContentMotion, styles.desktopMenuContent)}
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
              <div className="flex items-center gap-2 opacity-0 animate-fade-in scale-100! delay-300">
                <div
                  className={cn(
                    'flex items-center gap-2 transition-opacity',
                    isUserLoading ? 'opacity-0' : 'opacity-100'
                  )}
                >
                  <DevToolbarTrigger />
                  <GitHubButton />
                  {isLoggedIn ? (
                    <>
                      <Button className="hidden lg:block" asChild>
                        <Link href="/dashboard/projects">Dashboard</Link>
                      </Button>
                      <AuthenticatedDropdownMenu menu={userMenu} user={user} site="www" />
                    </>
                  ) : (
                    <>
                      <Button variant="default" className="hidden lg:block" asChild>
                        <Link
                          href="https://supabase.com/dashboard"
                          onClick={() =>
                            sendTelemetryEvent({
                              action: 'sign_in_button_clicked',
                              properties: { buttonLocation: 'Header Nav' },
                            })
                          }
                        >
                          Sign in
                        </Link>
                      </Button>
                      <Button className="hidden lg:block" asChild>
                        <Link
                          href="https://supabase.com/dashboard/sign-up"
                          onClick={() =>
                            sendTelemetryEvent({
                              action: 'start_project_button_clicked',
                              properties: { buttonLocation: 'Header Nav' },
                            })
                          }
                        >
                          Start your project
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
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
