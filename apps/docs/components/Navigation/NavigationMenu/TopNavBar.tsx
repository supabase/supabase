import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { FC } from 'react'
import { Button, IconCommand, IconGitHub, IconSearch } from 'ui'
import { SearchButton } from 'ui-patterns/Cmdk'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { ThemeToggle } from 'ui-patterns/ThemeToggle'

const TopNavBar: FC = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const { resolvedTheme } = useTheme()

  return (
    <nav
      aria-label="top bar"
      className="h-[var(--desktop-header-height,60px)] border-b backdrop-blur backdrop-filter bg bg-opacity-75"
    >
      <div className="px-5 max-w-7xl mx-auto flex gap-3 justify-between items-center h-full">
        <div className="lg:hidden">
          <Link href="/" className=" flex items-center gap-2">
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

        <div className="flex items-center gap-6">
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
    </nav>
  )
}
export default TopNavBar
