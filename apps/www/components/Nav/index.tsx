'use client'

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import ScrollProgress from 'components/ScrollProgress'
import { getMenu } from 'data/nav'
import { DevToolbarTrigger } from 'dev-tools'
import { useSendTelemetryEvent } from 'lib/telemetry'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { useWindowSize } from 'react-use'
import { Button, cn, FloatingPlate } from 'ui'
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import { TopNavMenu, TopNavMenuItem, TopNavMenuLink } from 'ui-patterns/TopNav/TopNavMenu'

import GitHubButton from './GitHubButton'
import HamburgerButton from './HamburgerMenu'
import { getLinkComponent } from './MenuItem'
import { MobileMenu } from './MobileMenu'
import RightClickBrandLogo from './RightClickBrandLogo'
import useDropdownMenu from './useDropdownMenu'

interface Props {
  hideNavbar: boolean
  stickyNavbar?: boolean
}

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

  const isGAWeekSection = pathname?.startsWith('/ga-week')
  const isStateOfStartupsPage = pathname?.startsWith('/state-of-startups')
  const disableStickyNav = isGAWeekSection || !stickyNavbar
  const showLaunchWeekNavMode = isGAWeekSection && !open

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
            `relative z-40 border-default max-lg:border-b backdrop-blur-xs transition-all duration-300`,
            showLaunchWeekNavMode && 'border-muted border-b bg-transparent',
            isTransparent && 'border-transparent backdrop-blur-none'
          )}
        >
          <div className="section-container flex justify-between h-(--header-height)">
            <div className="flex items-center flex-1 sm:items-stretch justify-between">
              <div className="flex items-center">
                <div className="flex items-center shrink-0">
                  <RightClickBrandLogo />
                </div>
                <TopNavMenu className="hidden lg:flex ml-5.5">
                  {menu.primaryNav.map((menuItem) =>
                    menuItem.hasDropdown ? (
                      <TopNavMenuItem key={menuItem.title} label={menuItem.title}>
                        {menuItem.dropdown}
                      </TopNavMenuItem>
                    ) : (
                      <TopNavMenuLink
                        key={menuItem.title}
                        linkAs={getLinkComponent(menuItem.url)}
                        href={menuItem.url}
                      >
                        {menuItem.title}
                      </TopNavMenuLink>
                    )
                  )}
                </TopNavMenu>
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
                      {isStateOfStartupsPage ? (
                        <FloatingPlate rounded="md" className="hidden lg:inline-flex">
                          <Button asChild>
                            <a href="/dashboard/projects">Dashboard</a>
                          </Button>
                        </FloatingPlate>
                      ) : (
                        <Button className="hidden lg:inline-flex" asChild>
                          <a href="/dashboard/projects">Dashboard</a>
                        </Button>
                      )}
                      <AuthenticatedDropdownMenu menu={userMenu} user={user} site="www" />
                    </>
                  ) : (
                    <>
                      {isStateOfStartupsPage ? (
                        <FloatingPlate rounded="md" className="hidden lg:inline-flex">
                          <Button asChild>
                            <a
                              href="https://supabase.com/dashboard"
                              onClick={() =>
                                sendTelemetryEvent({
                                  action: 'sign_in_button_clicked',
                                  properties: { buttonLocation: 'Header Nav' },
                                })
                              }
                            >
                              Sign in
                            </a>
                          </Button>
                        </FloatingPlate>
                      ) : (
                        <Button className="hidden lg:inline-flex" asChild>
                          <a
                            href="https://supabase.com/dashboard"
                            onClick={() =>
                              sendTelemetryEvent({
                                action: 'sign_in_button_clicked',
                                properties: { buttonLocation: 'Header Nav' },
                              })
                            }
                          >
                            Sign in
                          </a>
                        </Button>
                      )}
                      <Button variant="primary" className="hidden lg:inline-flex" asChild>
                        <a
                          href="https://supabase.com/dashboard/sign-up"
                          onClick={() =>
                            sendTelemetryEvent({
                              action: 'start_project_button_clicked',
                              properties: { buttonLocation: 'Header Nav' },
                            })
                          }
                        >
                          Start your project
                        </a>
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
