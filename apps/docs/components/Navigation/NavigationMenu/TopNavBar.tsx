import { FC, memo } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { Button, IconCommand, IconGitHub, IconSearch } from 'ui'
import { SearchButton } from 'ui-patterns/Cmdk'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { ThemeToggle } from 'ui-patterns/ThemeToggle'
import GlobalNavigationMenu from './GlobalNavigationMenu'

const TopNavBar: FC = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const { resolvedTheme } = useTheme()

  const HeaderLogo = memo(() => {
    const { resolvedTheme } = useTheme()
    return (
      <Link href="/" className="flex h-full items-center gap-2">
        <Image
          className="cursor-pointer"
          src={
            resolvedTheme?.includes('dark') ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'
          }
          width={96}
          height={24}
          alt="Supabase Logo"
        />
        <span className="font-mono text-sm font-medium text-brand-link">DOCS</span>
      </Link>
    )
  })

  HeaderLogo.displayName = 'HeaderLogo'

  return (
    <nav
      aria-label="top bar"
      className="w-full fixed z-40 flex flex-col border-b backdrop-blur backdrop-filter bg bg-opacity-75"
    >
      <div className="w-full px-5 flex justify-between h-[var(--header-height,50px)] lg:h-[var(--header-height,60px)]">
        <div className="hidden px-5 lg:flex h-full items-center bg-background flex-col gap-8">
          <HeaderLogo />
        </div>
        <div className="w-full lg:w-auto max-w-7xl flex gap-3 justify-between items-center h-full">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image
                className="cursor-pointer"
                src={
                  resolvedTheme?.includes('dark')
                    ? '/docs/supabase-dark.svg'
                    : '/docs/supabase-light.svg'
                }
                width={96}
                height={24}
                alt="Supabase Logo"
              />
              <span className="font-mono text-sm font-medium text-brand-link">DOCS</span>
            </Link>
          </div>

          <div className="md:w-full md:max-w-xs flex items-center gap-6">
            <SearchButton className="md:w-full lg:w-96 order-2 lg:order-1">
              <div
                className="
                  flex
                  group
                  items-center
                  justify-between
                  bg-surface-100
                  bg-opacity-75
                  hover:bg-surface-200
                  hover:bg-opacity-100
                  border
                  transition
                  pl-1.5 md:pl-3 pr-1.5 w-full h-[32px] rounded
                  text-foreground-lighter
                "
              >
                <div className="flex items-center space-x-2">
                  <IconSearch size={18} strokeWidth={2} />
                  <p className="hidden md:flex text-sm">Search docs...</p>
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
          </div>
          <div className="hidden lg:flex grow items-center justify-end gap-3">
            <Button type="text" asChild>
              <a href="https://supabase.com" target="_blank" rel="noreferrer noopener">
                Supabase.com
              </a>
            </Button>
            {!isUserLoading && (
              <Button asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer noopener">
                  {isLoggedIn ? 'Dashboard' : 'Sign up'}
                </a>
              </Button>
            )}
            {process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true' && (
              <Button asChild>
                <Link href="/__dev-secret-auth">Dev-only secret sign-in</Link>
              </Button>
            )}
            <Link
              href="https://github.com/supabase/supabase"
              target="_blank"
              rel="noreferrer noopener"
              className="px-2.5 py-1"
            >
              <span className="sr-only">GitHub</span>
              <IconGitHub
                size={16}
                className="text-foreground-light hover:text-foreground transition"
              />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <GlobalNavigationMenu />
    </nav>
  )
}

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
