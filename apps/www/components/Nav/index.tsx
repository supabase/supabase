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
import {
  Button,
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
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import { AnnouncementBanner } from 'ui-patterns/Banners/AnnouncementBanner'

import GitHubButton from './GitHubButton'
import HamburgerButton from './HamburgerMenu'
import MenuItem from './MenuItem'
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
  const [activeDropdown, setActiveDropdown] = useState('')
  const [visibleDropdown, setVisibleDropdown] = useState('')
  const [isSwitchingDropdown, setIsSwitchingDropdown] = useState(false)
  const [openedDropdowns, setOpenedDropdowns] = useState<string[]>([])
  const handleDropdownChange = (value: string) => {
    // animate card height between two open menus only
    setIsSwitchingDropdown(value !== '' && activeDropdown !== '')
    setActiveDropdown(value)
    if (value === '') return
    setVisibleDropdown(value)
    if (!openedDropdowns.includes(value)) setOpenedDropdowns([...openedDropdowns, value])
  }
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const user = useUser()
  const menu = getMenu()
  const dropdownTitles: string[] = menu.primaryNav
    .filter((menuItem) => menuItem.hasDropdown)
    .map((menuItem) => menuItem.title)
  const getDropdownSide = (title: string) => {
    if (title === visibleDropdown) return 'active'
    return dropdownTitles.indexOf(title) < dropdownTitles.indexOf(visibleDropdown) ? 'start' : 'end'
  }
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
      {!isStateOfStartupsPage && <AnnouncementBanner />}
      <div
        className={cn(
          'sticky top-0 z-40 transform',
          disableStickyNav && 'relative',
          isStateOfStartupsPage && 'fixed left-0 right-0'
        )}
        style={{ transform: 'translate3d(0,0,999px)' }}
        data-nav-transparent={isTransparent ? '' : undefined}
      >
        {isStateOfStartupsPage && <AnnouncementBanner />}
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
                  value={activeDropdown}
                  onValueChange={handleDropdownChange}
                  renderViewport={false}
                  className="static hidden pl-8 lg:flex h-16 items-stretch"
                >
                  <NavigationMenuList className="h-full space-x-0 items-stretch">
                    {menu.primaryNav.map((menuItem) =>
                      menuItem.hasDropdown ? (
                        <NavigationMenuItem
                          className="text-sm font-medium"
                          key={menuItem.title}
                          value={menuItem.title}
                        >
                          <NavigationMenuTrigger
                            className={cn(
                              buttonVariants({ variant: 'text', size: 'small' }),
                              'bg-transparent! hover:text-primary data-open:text-primary! focus-ring focus-visible:text-foreground px-2.5 h-full'
                            )}
                          >
                            {menuItem.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent
                            forceMount
                            inert={visibleDropdown !== menuItem.title}
                            data-active={visibleDropdown === menuItem.title}
                            data-side={getDropdownSide(menuItem.title)}
                            className={cn(
                              'md:w-full data-[motion^=from-]:animate-none! data-[motion^=to-]:animate-none!',
                              'data-[active=false]:pointer-events-none data-[active=false]:opacity-0',
                              'data-[side=start]:-translate-x-4 data-[side=end]:translate-x-4',
                              'motion-safe:group-data-[switching=true]/viewport:transition-[opacity,translate]',
                              'motion-safe:group-data-[switching=true]/viewport:duration-250',
                              'motion-safe:group-data-[switching=true]/viewport:ease-in-out'
                            )}
                          >
                            {openedDropdowns.includes(menuItem.title) ? menuItem.dropdown : null}
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      ) : (
                        <NavigationMenuItem className="text-sm font-medium" key={menuItem.title}>
                          <NavigationMenuLink asChild>
                            <MenuItem
                              href={menuItem.url}
                              title={menuItem.title}
                              className="group-hover:bg-transparent text-foreground focus-visible:text-primary px-2.5 h-full"
                              hoverColor="brand"
                            />
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )
                    )}
                  </NavigationMenuList>
                  <NavigationMenuViewport
                    forceMount
                    data-open={activeDropdown !== ''}
                    data-switching={isSwitchingDropdown}
                    containerProps={{ className: 'inset-x-0' }}
                    className={cn(
                      'group/viewport origin-top scale-100 rounded-xl bg-surface-75 md:w-[960px]',
                      'data-[state=open]:animate-none! data-[state=closed]:animate-none!',
                      'data-[state=open]:duration-200 data-[state=open]:ease-out data-[state=closed]:duration-200',
                      'data-[open=false]:invisible data-[open=false]:scale-[0.97] data-[open=false]:opacity-0',
                      'data-[open=false]:pointer-events-none',
                      'motion-safe:transition-[opacity,scale,visibility]',
                      'motion-safe:data-[switching=true]:transition-[height,opacity,scale,visibility]',
                      'motion-reduce:transition-none'
                    )}
                  />
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
                      <Button className="hidden lg:inline-flex" asChild>
                        <Link href="/dashboard/projects">Dashboard</Link>
                      </Button>
                      <AuthenticatedDropdownMenu menu={userMenu} user={user} site="www" />
                    </>
                  ) : (
                    <>
                      <Button className="hidden lg:inline-flex" asChild>
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
                      <Button variant="primary" className="hidden lg:inline-flex" asChild>
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
