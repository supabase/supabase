import { Command, Menu, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { FC } from 'react'
import { memo, useState } from 'react'
// End of third-party imports

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import { isFeatureEnabled } from 'common/enabled-features'
import { DevToolbarTrigger } from 'dev-tools'
import { Button, buttonVariants, cn } from 'ui'
import { AuthenticatedDropdownMenu, CommandMenuTriggerInput } from 'ui-patterns'
import { getCustomContent } from '../../../lib/custom-content/getCustomContent'
import GlobalNavigationMenu from './GlobalNavigationMenu'
import useDropdownMenu from './useDropdownMenu'

const GlobalMobileMenu = dynamic(() => import('./GlobalMobileMenu'))
const TopNavDropdown = dynamic(() => import('./TopNavDropdown'))

const largeLogo = isFeatureEnabled('branding:large_logo')

const TopNavBar: FC = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useUser()
  const menu = useDropdownMenu(user)

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
              <DevToolbarTrigger />
              <CommandMenuTriggerInput
                placeholder={
                  <>
                    Search
                    <span className="hidden xl:inline ml-1"> docs...</span>
                  </>
                }
              />
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
                <a href="/dashboard" className="h-[30px]" target="_blank" rel="noreferrer noopener">
                  {isLoggedIn ? 'Dashboard' : 'Sign up'}
                </a>
              </Button>
            )}
            {process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true' && (
              <Button asChild>
                <Link href="/dev-secret-auth">Dev-only secret sign-in</Link>
              </Button>
            )}
            {isLoggedIn ? (
              <AuthenticatedDropdownMenu menu={menu} user={user} site="docs" />
            ) : (
              <TopNavDropdown />
            )}
          </div>
        </div>
      </nav>
      <GlobalMobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} />
    </>
  )
}

const HeaderLogo = memo(() => {
  const { navigationLogo } = getCustomContent(['navigation:logo'])

  return (
    <Link
      href="/"
      className={cn(
        buttonVariants({ type: 'default' }),
        'flex shrink-0 items-center w-fit !bg-transparent !border-none !shadow-none'
      )}
    >
      <Image
        className={cn('hidden dark:block !m-0', largeLogo && 'h-[36px]')}
        src={navigationLogo?.dark ?? '/docs/supabase-dark.svg'}
        priority={true}
        loading="eager"
        width={navigationLogo?.width ?? 96}
        height={navigationLogo?.height ?? 18}
        alt="Supabase wordmark"
      />
      <Image
        className={cn('block dark:hidden !m-0', largeLogo && 'h-[36px]')}
        src={navigationLogo?.light ?? '/docs/supabase-light.svg'}
        priority={true}
        loading="eager"
        width={navigationLogo?.width ?? 96}
        height={navigationLogo?.height ?? 18}
        alt="Supabase wordmark"
      />
      <span className="font-mono text-sm font-medium text-brand-link mb-px">DOCS</span>
    </Link>
  )
})

HeaderLogo.displayName = 'HeaderLogo'

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
