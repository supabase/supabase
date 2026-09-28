// End of third-party imports

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import { isFeatureEnabled } from 'common/enabled-features'
import { DevToolbarTrigger } from 'dev-tools'
import { Command, Menu, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { Ref } from 'react'
import { memo, useState } from 'react'
import { Button, buttonVariants, cn } from 'ui'
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import { CommandMenuTriggerInput } from 'ui-patterns/CommandMenu'

import { getCustomContent } from '../../../lib/custom-content/getCustomContent'
import { DOCS_SECTIONS_MENU_HEIGHT_STYLE, DocsSectionsMenu } from './DocsSectionsMenu'
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'
import { HeaderUtilityLinks } from './HeaderUtilityLinks'
import { PageActionButtons } from './PageActionButtons'
import useDropdownMenu from './useDropdownMenu'
import { SearchV2Trigger, useSearchV2Variant } from '@/features/SearchV2'

interface ClassNameProps {
  className?: string
}

interface TopNavBarProps {
  headingSlotRef?: Ref<HTMLLIElement>
}

interface HeaderLogoProps {
  hasDocsLabel?: boolean
}

const GlobalMobileMenu = dynamic(() => import('./GlobalMobileMenu'))

const largeLogo = isFeatureEnabled('branding:large_logo')

const TopNavBar = ({ headingSlotRef }: TopNavBarProps) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useUser()
  const menu = useDropdownMenu(user)
  return (
    <>
      <nav
        aria-label="top bar"
        className="w-full z-40 flex flex-col backdrop-blur-sm backdrop-filter bg-default/75"
      >
        <div className="w-full flex h-(--header-height) border-b border-dashed">
          <div
            style={DOCS_SECTIONS_MENU_HEIGHT_STYLE}
            className="docs-sections-cell relative hidden lg:flex w-70 shrink-0 items-center gap-1.5 px-4 border-r border-dashed"
          >
            <HeaderLogo hasDocsLabel={false} />
            <DocsSectionsMenu />
          </div>
          <div className="hidden lg:flex min-w-0 flex-1 items-center gap-4 pl-6 pr-2">
            <HeaderBreadcrumbs headingSlotRef={headingSlotRef} />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <DocsSearchTrigger className="hidden lg:flex lg:group-has-[[data-docs-sidebar]]/docs:hidden" />
              <PageActionButtons />
            </div>
          </div>
          <div className="hidden lg:flex w-70 shrink-0 items-center justify-end gap-3 pl-4 pr-2.5 border-dashed group-has-[[data-docs-right-rail]]/docs:border-l">
            <DevToolbarTrigger />
            <HeaderUtilityLinks />
            {process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true' && (
              <Button asChild>
                <Link href="/dev-secret-auth">Dev-only secret sign-in</Link>
              </Button>
            )}
            {!isUserLoading && (
              <Button variant="default" asChild>
                <a href="/dashboard" className="h-[30px]" target="_blank" rel="noreferrer noopener">
                  {isLoggedIn ? 'Dashboard' : 'Sign up'}
                </a>
              </Button>
            )}
            {isLoggedIn ? <AuthenticatedDropdownMenu menu={menu} user={user} site="docs" /> : null}
          </div>
          <div className="flex lg:hidden w-full px-5 gap-3 justify-between items-center">
            <HeaderLogo />
            <div className="flex gap-2 items-center">
              <PageActionButtons className="hidden md:flex" />
              <DevToolbarTrigger />
              <DocsSearchTrigger />
              <button
                tabIndex={0}
                title="Menu dropdown button"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] px-0 data-open:bg-overlay-hover/30'
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={18} strokeWidth={1} />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <GlobalMobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} />
    </>
  )
}

export const DocsSearchTrigger = ({ className }: ClassNameProps) => {
  const searchVariant = useSearchV2Variant()
  const placeholder = (
    <>
      Search
      <span className="hidden xl:inline ml-1"> docs...</span>
    </>
  )

  return searchVariant === 'search-v2-active' ? (
    <SearchV2Trigger
      className={cn('[&>div>p]:text-foreground-lighter', className)}
      placeholder={placeholder}
    />
  ) : (
    <CommandMenuTriggerInput
      className={cn('[&>div>p]:text-foreground-lighter', className)}
      placeholder={placeholder}
    />
  )
}

const HeaderLogo = memo(({ hasDocsLabel = true }: HeaderLogoProps) => {
  const { navigationLogo } = getCustomContent(['navigation:logo'])

  return (
    <Link href="/" className="flex shrink-0 items-center gap-1.5 w-fit">
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
      {hasDocsLabel ? (
        <span className="font-mono text-sm font-medium text-primary mb-px">DOCS</span>
      ) : null}
    </Link>
  )
})

HeaderLogo.displayName = 'HeaderLogo'

TopNavBar.displayName = 'TopNavBar'

export default TopNavBar
