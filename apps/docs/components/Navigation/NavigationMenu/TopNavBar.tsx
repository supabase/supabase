import { Command, Search, Menu } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { FC } from 'react'
import { memo, useState } from 'react'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Button, buttonVariants, cn } from 'ui'
import { CommandMenuTrigger } from 'ui-patterns/CommandMenu'

import GlobalNavigationMenu from './GlobalNavigationMenu'
const GlobalMobileMenu = dynamic(() => import('./GlobalMobileMenu'))
const TopNavDropdown = dynamic(() => import('./TopNavDropdown'))

const TopNavBar: FC = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="top bar"
        className="w-full z-40 flex flex-col border-b backdrop-blur backdrop-filter bg bg-opacity-75"
      >
        <div className="w-full px-5 lg:pl-10 flex justify-between h-[var(--header-height)] gap-3">
          <div className="hidden lg:flex h-full items-center justify-center gap-2">
            <HeaderLogo />
            <GlobalNavigationMenu />
          </div>
          <div className="w-full grow lg:w-auto flex gap-3 justify-between lg:justify-end items-center h-full">
            <div className="lg:hidden">
              <HeaderLogo />
            </div>

            <div className="flex gap-2 items-center">
              <CommandMenuTrigger>
                <button
                  className={cn(
                    'group',
                    'flex-grow md:w-44 xl:w-56 h-[30px] rounded-md',
                    'pl-1.5 md:pl-2 pr-1',
                    'flex items-center justify-between',
                    'bg-surface-100/75 text-foreground-lighter border',
                    'hover:bg-opacity-100 hover:border-strong',
                    'focus-visible:!outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                    'transition'
                  )}
                >
                  <div className="flex items-center space-x-2 text-foreground-muted">
                    <Search size={18} strokeWidth={2} />
                    <p className="flex text-sm pr-2">
                      Search<span className="hidden xl:inline ml-1"> docs...</span>
                    </p>
                  </div>
                  <div className="hidden md:flex items-center space-x-1">
                    <div
                      aria-hidden="true"
                      className="md:flex items-center justify-center h-full px-1 border rounded bg-surface-300 gap-0.5"
                    >
                      <Command size={12} strokeWidth={1.5} />
                      <span className="text-[12px]">K</span>
                    </div>
                  </div>
                </button>
              </CommandMenuTrigger>
              <button
                title="Menu dropdown button"
                className={cn(
                  buttonVariants({ type: 'default' }),
                  'flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30'
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={18} strokeWidth={1} />
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-end gap-3">
            {!isUserLoading && (
              <Button asChild>
                <a
                  href="https://supabase.com/dashboard"
                  className="h-[30px]"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {isLoggedIn ? 'Dashboard' : 'Sign up'}
                </a>
              </Button>
            )}
            {process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true' && (
              <Button asChild>
                <Link href="/dev-secret-auth">Dev-only secret sign-in</Link>
              </Button>
            )}
            <TopNavDropdown />
          </div>
        </div>
      </nav>
      <GlobalMobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} />
    </>
  )
}

const HeaderLogo = memo(() => {
  return (
    <Link
      href="/"
      className={cn(
        buttonVariants({ type: 'default' }),
        'flex shrink-0 items-center w-fit !bg-transparent !border-none !shadow-none'
      )}
    >
      <Image
        className="hidden dark:block !m-0"
        src="/docs/supabase-dark.svg"
        priority={true}
        loading="eager"
        width={96}
        height={18}
        alt="Supabase wordmark"
      />
      <Image
        className="block dark:hidden !m-0"
        src="/docs/supabase-light.svg"
        priority={true}
        loading="eager"
        width={96}
        height={18}
        alt="Supabase wordmark"
      />
      <span className="font-mono text-sm font-medium text-brand-link mb-px">DOCS</span>
    </Link>
  )
})

HeaderLogo.displayName = 'HeaderLogo'

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
