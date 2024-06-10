import { FC, memo, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { SearchButton } from 'ui-patterns/Cmdk'
import GlobalMobileMenu from './GlobalMobileMenu'
import { ThemeToggle } from 'ui-patterns'
import { Button, IconCommand, IconGitHub, IconMenu, IconSearch, buttonVariants, cn } from 'ui'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import GlobalNavigationMenu from './GlobalNavigationMenu'
import TopNavDropdown from './TopNavDropdown'

const TopNavBar: FC = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  return (
    <>
      <nav
        aria-label="top bar"
        className="w-full z-40 flex flex-col border-b backdrop-blur backdrop-filter bg bg-opacity-75"
      >
        <div className="w-full px-5 flex justify-between h-[var(--header-height,50px)] gap-3 lg:h-[var(--header-height,60px)]">
          <div className="hidden px-5 lg:flex h-full items-center justify-center flex-col gap-8">
            <HeaderLogo />
          </div>
          <div className="w-full grow lg:w-auto max-w-7xl flex gap-3 justify-between lg:justify-end items-center h-full">
            <div className="lg:hidden">
              <HeaderLogo />
            </div>

            <div className="flex gap-2 items-center">
              <SearchButton
                className="flex-grow md:w-full lg:w-96 h-[30px]
                          focus-visible:!outline-4 
                          focus-visible:outline-offset-1
                          focus-visible:outline-brand-600"
              >
                <div
                  className="
                    flex
                    group
                    items-center
                    justify-between
                    bg-surface-100/75
                    hover:bg-opacity-100
                    hover:border-strong
                    border
                    transition
                    pl-1.5 md:pl-3 pr-1 w-full h-full rounded-md
                    text-foreground-lighter
                  "
                >
                  <div className="flex items-center space-x-2">
                    <IconSearch size={18} strokeWidth={2} />
                    <p className="flex text-sm pr-2">Search docs...</p>
                  </div>
                  <div className="hidden md:flex items-center space-x-1">
                    <div
                      aria-hidden="true"
                      className="md:flex items-center justify-center h-5 w-10 border rounded bg-surface-300 gap-1"
                    >
                      <IconCommand size={12} strokeWidth={1.5} />
                      <span className="text-[12px]">K</span>
                    </div>
                  </div>
                </div>
              </SearchButton>
              <button
                title="Menu dropdown button"
                className={cn(
                  buttonVariants({ type: 'default' }),
                  'flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30'
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <IconMenu />
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
                <Link href="/__dev-secret-auth">Dev-only secret sign-in</Link>
              </Button>
            )}
            <TopNavDropdown />
          </div>
        </div>
        <GlobalNavigationMenu />
      </nav>
      <GlobalMobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} />
    </>
  )
}

const HeaderLogo = memo(() => {
  const { resolvedTheme } = useTheme()
  return (
    <Link
      href="/"
      className={cn(
        buttonVariants({ type: 'default' }),
        'flex h-auto items-center !bg-transparent !border-none !shadow-none'
      )}
    >
      <Image
        className="cursor-pointer"
        src={
          resolvedTheme?.includes('dark') ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'
        }
        width={96}
        height={24}
        alt="Supabase Logo"
      />
      <span className="font-mono text-sm font-medium text-brand-link mb-px">DOCS</span>
    </Link>
  )
})

HeaderLogo.displayName = 'HeaderLogo'

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
