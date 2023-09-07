import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import FlyOut from '~/components/UI/FlyOut'
import Announcement from '~/components/Announcement/Announcement'
import { Button, LW8CountdownBanner, cn } from 'ui'
import ScrollProgress from '~/components/ScrollProgress'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { useTheme } from 'next-themes'
import TextLink from '../TextLink'
import Image from 'next/image'
import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'
import GitHubButton from './GitHubButton'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'ui/src/components/shadcn/ui/navigation-menu'
import HamburgerButton from './HamburgerMenu'
import Developers from './Developers'
import Product from './Product'
import ProductIcon from '../ProductIcon'
import { data as DevelopersData } from 'data/Developers'
import MobileMenu from './MobileMenu'

const menu = {
  primaryNav: [
    {
      title: 'Product',
      hasDropdown: true,
      dropdown: <Product />,
      dropdownContainerClassName: 'rounded-lg flex flex-row',
      subMenu: null,
    },
    {
      title: 'Developers',
      hasDropdown: true,
      dropdown: <Developers />,
      dropdownContainerClassName: 'rounded-lg',
      subMenu: DevelopersData,
    },
    {
      title: 'Pricing',
      url: '/pricing',
    },
    {
      title: 'Docs',
      url: '/docs',
    },
    {
      title: 'Blog',
      url: '/blog',
    },
  ],
}

export const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { description?: string; icon?: string }
>(({ className, title, href = '', description, icon, children, ...props }, ref) => {
  return (
    <Link href={href} passHref>
      <a
        ref={ref}
        className={cn(
          'group flex flex-row select-none space-x-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-overlay-hover focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && <ProductIcon icon={icon} color="alt" />}
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              {description && (
                <p className="line-clamp-2 text-sm leading-snug text-light">{description}</p>
              )}
            </div>
          </>
        )}
      </a>
    </Link>
  )
})

const Nav = () => {
  const { theme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [openProduct, setOpenProduct] = useState(false)
  const [openDevelopers, setOpenDevelopers] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()

  const isHomePage = router.pathname === '/'
  const isLaunchWeekPage = router.pathname.includes('launch-week')
  const showLaunchWeekNavMode =
    (isLaunchWeekPage || isHomePage) && !open && !openProduct && !openDevelopers

  React.useEffect(() => {
    if (open) {
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [open])

  return (
    <>
      <div className="sticky top-0 z-40 transform" style={{ transform: 'translate3d(0,0,999px)' }}>
        <div
          className={[
            'absolute inset-0 h-full w-full opacity-80 bg-scale-200',
            !showLaunchWeekNavMode && '!opacity-100 transition-opacity',
            showLaunchWeekNavMode && '!bg-transparent transition-all',
          ].join(' ')}
        />
        <nav
          className={[
            `relative z-40 border-scale-300 border-b backdrop-blur-sm transition-opacity`,
            showLaunchWeekNavMode ? '!opacity-100 !border-[#e0d2f430]' : '',
            isLaunchWeekPage && showLaunchWeekNavMode ? '!border-b-0' : '',
          ].join(' ')}
        >
          <div className="relative flex justify-between h-16 mx-auto lg:container lg:px-16 xl:px-20">
            <div className="flex items-center px-6 flex-1 sm:items-stretch justify-between">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  <Link href="/" as="/">
                    <a className="block w-auto h-6">
                      <Image
                        src={
                          isLaunchWeekPage || resolvedTheme === 'dark' || isHomePage
                            ? supabaseLogoWordmarkDark
                            : supabaseLogoWordmarkLight
                        }
                        width={124}
                        height={24}
                        alt="Supabase Logo"
                      />
                    </a>
                  </Link>

                  {isLaunchWeekPage && (
                    <Link href="/launch-week" as="/launch-week">
                      <a className="hidden ml-2 xl:block font-mono text-sm uppercase leading-4">
                        Launch Week
                      </a>
                    </Link>
                  )}
                </div>
                <NavigationMenu className="hidden pl-4 sm:ml-4 sm:space-x-4 lg:flex h-16">
                  <NavigationMenuList>
                    {menu.primaryNav.map((menuItem) =>
                      menuItem.hasDropdown ? (
                        <NavigationMenuItem className="text-sm font-medium">
                          <NavigationMenuTrigger className="bg-transparent data-[state=open]:text-brand data-[radix-collection-item]:focus-visible:ring-2 data-[radix-collection-item]:focus-visible:ring-foreground-lighter data-[radix-collection-item]:focus-visible:text-foreground-strong">
                            {menuItem.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent className={menuItem.dropdownContainerClassName}>
                            {menuItem.dropdown}
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      ) : (
                        <NavigationMenuItem className="text-sm font-medium">
                          <NavigationMenuLink asChild>
                            <ListItem
                              href={menuItem.url}
                              title={menuItem.title}
                              className="group-hover:bg-transparent hover:text-brand"
                            />
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )
                    )}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
              <div className="flex items-center gap-2">
                <GitHubButton />
                {!isUserLoading && (
                  <>
                    {isLoggedIn ? (
                      <Link href="/dashboard/projects">
                        <a>
                          <Button className="hidden text-white lg:block">Dashboard</Button>
                        </a>
                      </Link>
                    ) : (
                      <>
                        <Link href="https://supabase.com/dashboard">
                          <a>
                            <Button type="default" className="hidden lg:block">
                              Sign in
                            </Button>
                          </a>
                        </Link>
                        <Link href="https://supabase.com/dashboard">
                          <a>
                            <Button className="hidden text-white lg:block">
                              Start your project
                            </Button>
                          </a>
                        </Link>
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

          <MobileMenu open={open} setOpen={setOpen} isDarkMode={isDarkMode} />
        </nav>

        <ScrollProgress />
      </div>
    </>
  )
}

export default Nav
