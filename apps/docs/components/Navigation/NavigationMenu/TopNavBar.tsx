// End of third-party imports

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import { isFeatureEnabled } from 'common/enabled-features'
import { DevToolbarTrigger } from 'dev-tools'
import { Command, Menu, Search, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import type { FC, Ref } from 'react'
import { memo, useState } from 'react'
import { Button, buttonVariants, cn } from 'ui'
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import { CommandMenuTriggerInput } from 'ui-patterns/CommandMenu'
import { MobileNavThemeButton } from 'ui-patterns/MobileNav/MobileNavThemeButton'
import { HeadingReel } from 'ui-patterns/Toc/heading-reel'

import { getCustomContent } from '../../../lib/custom-content/getCustomContent'
import GlobalNavigationMenu from './GlobalNavigationMenu'
import useDropdownMenu from './useDropdownMenu'
import { SearchV2Trigger, useSearchV2Variant } from '@/features/SearchV2'

const GlobalMobileMenu = dynamic(() => import('./GlobalMobileMenu'))
const TopNavDropdown = dynamic(() => import('./TopNavDropdown'))

const largeLogo = isFeatureEnabled('branding:large_logo')

interface TopNavBarProps {
  // on pages with a sidebar the burger opens the sidebar drawer, not the global menu
  isMenuOpen?: boolean
  onMenuToggle?: () => void
  // the page title after it scrolls under the bar, null while the title is in view
  scrolledTitle?: string | null
  menuButtonRef?: Ref<HTMLButtonElement>
}

const TopNavBar: FC<TopNavBarProps> = ({
  isMenuOpen = false,
  onMenuToggle,
  scrolledTitle,
  menuButtonRef,
}) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useUser()
  const menu = useDropdownMenu(user)
  const searchVariant = useSearchV2Variant()
  const { theme, setTheme } = useTheme()

  const isOpen = onMenuToggle ? isMenuOpen : mobileMenuOpen
  const handleMenuToggle = onMenuToggle ?? (() => setMobileMenuOpen(!mobileMenuOpen))

  return (
    <>
      <nav
        aria-label="top bar"
        className="w-full z-40 flex flex-col subhighlight-border bg-default lg:bg-default/75 lg:backdrop-blur-sm lg:backdrop-filter"
      >
        <div className="w-full px-6 lg:pl-10 lg:pr-5 flex justify-between h-(--header-height) gap-3">
          <div className="hidden lg:flex h-full items-center justify-center gap-2">
            <HeaderLogo />
            <GlobalNavigationMenu />
          </div>
          <div className="w-full grow lg:w-auto flex gap-3 justify-between lg:justify-end items-center h-full">
            <div className="lg:hidden min-w-0">
              <MobileHeaderLogo scrolledTitle={scrolledTitle} />
            </div>

            <div className="flex gap-2 items-center">
              <DevToolbarTrigger />
              {onMenuToggle && isOpen ? (
                <MobileNavThemeButton value={theme} onValueChange={setTheme} />
              ) : searchVariant === 'search-v2-active' ? (
                <SearchV2Trigger
                  placeholder={
                    <>
                      Search
                      <span className="hidden xl:inline ml-1"> docs...</span>
                    </>
                  }
                />
              ) : (
                <CommandMenuTriggerInput
                  className="[&>div>p]:text-foreground-lighter"
                  placeholder={
                    <>
                      Search
                      <span className="hidden xl:inline ml-1"> docs...</span>
                    </>
                  }
                />
              )}
              <button
                ref={menuButtonRef}
                tabIndex={0}
                title="Menu dropdown button"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'relative flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] px-0 data-open:bg-overlay-hover/30',
                  "before:absolute before:-inset-y-2 before:left-0 before:-right-3 before:content-['']"
                )}
                onClick={handleMenuToggle}
              >
                <Menu
                  size={18}
                  strokeWidth={1}
                  className={cn(
                    'absolute inset-0 m-auto transition duration-150 ease-out',
                    isOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
                  )}
                />
                <X
                  size={18}
                  strokeWidth={1}
                  className={cn(
                    'absolute inset-0 m-auto transition duration-150 ease-out',
                    !isOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
                  )}
                />
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-end gap-3">
            {!isUserLoading && (
              <Button variant="primary" asChild>
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

const HeaderLogo = memo(() => (
  <Link href="/" className="flex shrink-0 items-center gap-1.5 w-fit">
    <HeaderLogoContent />
  </Link>
))

HeaderLogo.displayName = 'HeaderLogo'

const HeaderLogoContent = () => {
  const { navigationLogo } = getCustomContent(['navigation:logo'])

  return (
    <>
      <Image
        className={cn('hidden dark:block m-0!', largeLogo && 'h-[36px]')}
        src={navigationLogo?.dark ?? '/docs/supabase-dark.svg'}
        priority={true}
        loading="eager"
        width={navigationLogo?.width ?? 96}
        height={navigationLogo?.height ?? 18}
        alt="Supabase wordmark"
      />
      <Image
        className={cn('block dark:hidden m-0!', largeLogo && 'h-[36px]')}
        src={navigationLogo?.light ?? '/docs/supabase-light.svg'}
        priority={true}
        loading="eager"
        width={navigationLogo?.width ?? 96}
        height={navigationLogo?.height ?? 18}
        alt="Supabase wordmark"
      />
      <span className="font-mono text-sm font-medium text-primary mb-px">DOCS</span>
    </>
  )
}

const MobileHeaderLogo = ({ scrolledTitle }: { scrolledTitle?: string | null }) => {
  // the large logo is taller than the reel, so it does not roll
  if (largeLogo) return <HeaderLogo />

  return (
    <Link
      href="/"
      aria-label="Supabase docs"
      className="flex h-11 min-w-0 items-center text-sm font-medium text-foreground"
    >
      <HeadingReel id={scrolledTitle ?? 'logo'} index={scrolledTitle ? 1 : 0}>
        {scrolledTitle ?? (
          <span className="flex items-center gap-1.5">
            <HeaderLogoContent />
          </span>
        )}
      </HeadingReel>
    </Link>
  )
}

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
