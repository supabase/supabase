import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Badge, cn } from 'ui'
import FlyOut from '~/components/UI/FlyOut'
import Announcement from '~/components/Announcement/Announcement'
import Transition from 'lib/Transition'

import SolutionsData from 'data/Solutions'
import { links as DevelopersData } from 'data/Developers'

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

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, href, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          {href ? (
            <Link href={href}>
              <a
                ref={ref}
                className={cn(
                  'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  className
                )}
                {...props}
              >
                <div className="text-sm font-medium leading-none">{title}</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted">{children}</p>
              </a>
            </Link>
          ) : (
            <div
              className={cn(
                'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                className
              )}
            >
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted">{children}</p>
            </div>
          )}
        </NavigationMenuLink>
      </li>
    )
  }
)

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

  const iconSections = Object.values(SolutionsData).map((solution: any, idx: number) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="flex mb-3 md:h-full lg:flex-col">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center w-10 h-10 text-white bg-gray-800 rounded-md dark:bg-white dark:text-gray-800 sm:h-12 sm:w-12">
            {/* <!-- Heroicon name: chart-bar --> */}
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
        </div>
        <div className="ml-4 md:flex md:flex-1 md:flex-col md:justify-between lg:ml-0 lg:mt-4">
          <div>
            <p className="space-x-2 text-base font-medium text-gray-900 dark:text-white">
              <span>{name}</span>
              {label && (
                <Badge dot color="green">
                  {label}
                </Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-scale-1100 dark:text-dark-100">{description}</p>
          </div>
          {url && (
            <p className="mt-2 text-sm font-medium text-brand lg:mt-4">
              <TextLink label={label ? 'Get notified' : 'Learn more'} url={url} />
            </p>
          )}
        </div>
      </div>
    )
    return url ? (
      <Link href={url} key={`solution_${idx}`}>
        <a className="flex flex-col justify-between p-3 my-2 -m-3 transition duration-150 ease-in-out rounded-lg dark:hover:bg-scale-600 hover:bg-gray-50">
          {content}
        </a>
      </Link>
    ) : (
      <div
        key={`solution_${idx}`}
        className="flex flex-col justify-between p-3 -m-3 transition duration-150 ease-in-out rounded-lg"
      >
        {content}
      </div>
    )
  })

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
            <HamburgerButton
              toggleFlyOut={() => setOpen(true)}
              showLaunchWeekNavMode={showLaunchWeekNavMode}
            />
            <div className="flex items-center justify-center flex-1 sm:items-stretch lg:justify-between">
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
                <div className="hidden pl-4 sm:ml-6 sm:space-x-4 lg:flex">
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent">
                          Product
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                            {Object.values(SolutionsData).map((component) => (
                              <ListItem
                                key={component.name}
                                title={component.name}
                                href={component.url}
                              >
                                {component.description_short}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent">
                          Developers
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                            {Object.values(DevelopersData).map((component) => (
                              <ListItem
                                key={component.text}
                                title={component.text}
                                href={component.url}
                              >
                                {component.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                  <Link href="/pricing">
                    <a
                      className={[
                        `text-scale-1200 hover:text-brand hover:border-brand dark:text-dark-100 dark:hover:border-dark-100 inline-flex items-center
                        border-b-2 border-transparent p-5 px-1
                        text-sm font-medium`,
                        showLaunchWeekNavMode && '!text-white',
                      ].join(' ')}
                    >
                      Pricing
                    </a>
                  </Link>
                  <Link href="/docs">
                    <a
                      className={[
                        `text-scale-1200 hover:text-brand hover:border-brand dark:text-dark-100 dark:hover:border-dark-100 inline-flex items-center
                        border-b-2 border-transparent p-5 px-1
                        text-sm font-medium`,
                        showLaunchWeekNavMode && '!text-white',
                      ].join(' ')}
                    >
                      Docs
                    </a>
                  </Link>
                  <Link href="/blog">
                    <a
                      className={[
                        `text-scale-1200 hover:text-brand hover:border-brand dark:text-dark-100 dark:hover:border-dark-100 inline-flex items-center
                        border-b-2 border-transparent p-5 px-1
                        text-sm font-medium`,
                        showLaunchWeekNavMode && '!text-white',
                      ].join(' ')}
                    >
                      Blog
                    </a>
                  </Link>
                </div>
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
          </div>
          {/* </div> */}
          {/* Mobile Nav Menu */}
          <Transition
            appear={true}
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <div
              className={[
                'dark:bg-scale-300 fixed -inset-y-0 z-50 h-screen w-screen transform overflow-y-scroll bg-white p-4 md:p-8',
                open && '!bg-scale-300',
              ].join(' ')}
            >
              <div className="absolute items-center justify-between right-4 top-4">
                <div className="-mr-2">
                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 bg-white rounded-md text-scale-900 focus:ring-brand dark:bg-scale-300 dark:hover:bg-scale-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {/* </div> */}
              <div className="mt-6 mb-12">
                <div className="pt-2 pb-4 space-y-1">
                  <Link href="https://supabase.com/dashboard">
                    <a className="block pl-3 pr-4 text-base font-medium text-scale-900 dark:text-white">
                      Sign in
                    </a>
                  </Link>
                </div>
                <div className="pt-2 pb-4 space-y-1">
                  <Link href="/docs">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Developers
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Pricing
                    </a>
                  </Link>
                  <Link href="/docs">
                    <a
                      target="_blank"
                      className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                    >
                      Docs
                    </a>
                  </Link>
                  <Link href="/blog">
                    <a
                      target="_blank"
                      className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white"
                    >
                      Blog
                    </a>
                  </Link>
                  <Link href="/support">
                    <a className="block py-2 pl-3 pr-4 text-base font-medium rounded-md text-scale-900 dark:hover:bg-scale-600 hover:border-gray-300 hover:bg-gray-50 dark:text-white">
                      Support
                    </a>
                  </Link>
                </div>
                <div className="p-3">
                  <p className="mb-6 text-sm text-scale-900">Products available:</p>
                  {iconSections}
                </div>
              </div>
            </div>
          </Transition>
        </nav>

        <ScrollProgress />
      </div>
    </>
  )
}

export default Nav
