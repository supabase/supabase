// End of third-party imports

import { useIsLoggedIn, useIsUserLoading, useUser } from 'common'
import { isFeatureEnabled } from 'common/enabled-features'
import { DevToolbarTrigger } from 'dev-tools'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import type { Ref } from 'react'
import { memo } from 'react'
import { Button, cn } from 'ui'
import { AuthenticatedDropdownMenu } from 'ui-patterns/AuthenticatedDropdownMenu'
import { MobileNavThemeButton } from 'ui-patterns/MobileNav/MobileNavThemeButton'
import { HeadingReel } from 'ui-patterns/Toc/heading-reel'
import { TopNavMenuToggle } from 'ui-patterns/TopNav/TopNavMenuToggle'

import { getCustomContent } from '../../../lib/custom-content/getCustomContent'
import { DOCS_SECTIONS_MENU_HEIGHT_STYLE, DocsSectionsMenu } from './DocsSectionsMenu'
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'
import { PageActionButtons } from './PageActionButtons'
import useDropdownMenu from './useDropdownMenu'
import { AskAiTrigger } from '@/features/SearchV2'
import { SearchV2IconTrigger } from '@/features/SearchV2/SearchV2Trigger'

interface DesktopTopNavBarProps {
  headingSlotRef: Ref<HTMLLIElement>
  updatedAtSlotRef: Ref<HTMLDivElement>
}

interface MobileTopNavBarProps {
  isMenuOpen?: boolean
  onMenuToggle?: () => void
  // the page title after it scrolls under the bar, null while the title is in view
  scrolledTitle?: string | null
  menuButtonRef?: Ref<HTMLButtonElement>
}

interface HeaderLogoProps {
  hasDocsLabel?: boolean
}

const TopNavDropdown = dynamic(() => import('./TopNavDropdown'))

const largeLogo = isFeatureEnabled('branding:large_logo')

export const DesktopTopNavBar = ({ headingSlotRef, updatedAtSlotRef }: DesktopTopNavBarProps) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const user = useUser()
  const menu = useDropdownMenu(user)

  return (
    <nav
      aria-label="top bar"
      className="relative w-full z-40 flex flex-col bg-default/75 backdrop-blur-sm backdrop-filter"
    >
      <div className="w-full flex h-(--header-height) border-b">
        <div
          style={DOCS_SECTIONS_MENU_HEIGHT_STYLE}
          className="docs-sections-cell relative flex w-(--docs-side-column-width) shrink-0 items-center gap-1.5 pl-5.75 pr-4 border-r"
        >
          <a
            href="https://supabase.com"
            aria-label="Supabase.com"
            className="flex shrink-0 items-center rounded-md focus-ring"
          >
            <HeaderLogoContent hasDocsLabel={false} />
          </a>
          <DocsSectionsMenu />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-4 pl-6 pr-3">
          <HeaderBreadcrumbs headingSlotRef={headingSlotRef} />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div ref={updatedAtSlotRef} className="contents" />
            <PageActionButtons />
          </div>
        </div>
        <div className="flex w-(--docs-side-column-width) shrink-0 items-center justify-end gap-2 px-6 group-has-data-docs-right-rail/docs:border-l">
          <DevToolbarTrigger />
          <SearchV2IconTrigger />
          <AskAiTrigger />
          {!isUserLoading && !isLoggedIn ? (
            <Button variant="primary" asChild>
              <a href="/dashboard" className="h-[30px]" target="_blank" rel="noreferrer noopener">
                Sign up
              </a>
            </Button>
          ) : null}
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
  )
}

export const MobileTopNavBar = ({
  isMenuOpen = false,
  onMenuToggle,
  scrolledTitle,
  menuButtonRef,
}: MobileTopNavBarProps) => {
  const { theme, setTheme } = useTheme()

  return (
    <nav aria-label="top bar" className="relative w-full z-40 flex flex-col bg-default">
      <div className="w-full flex h-(--header-height) border-b">
        <div className="flex w-full px-6 gap-3 justify-between items-center">
          <div className="min-w-0">
            <MobileHeaderLogo scrolledTitle={scrolledTitle} />
          </div>
          <div className="flex gap-3 items-center">
            <PageActionButtons className="hidden md:flex" />
            <DevToolbarTrigger />
            {isMenuOpen ? (
              <MobileNavThemeButton value={theme} onValueChange={setTheme} />
            ) : (
              <>
                <SearchV2IconTrigger />
                <AskAiTrigger />
              </>
            )}
            <TopNavMenuToggle ref={menuButtonRef} isOpen={isMenuOpen} onClick={onMenuToggle} />
          </div>
        </div>
      </div>
    </nav>
  )
}

const HeaderLogo = memo(() => (
  <Link href="/" className="flex shrink-0 items-center gap-1.5 w-fit">
    <HeaderLogoContent />
  </Link>
))

HeaderLogo.displayName = 'HeaderLogo'

const HeaderLogoContent = ({ hasDocsLabel = true }: HeaderLogoProps) => {
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
      {hasDocsLabel ? (
        <span className="font-mono text-sm font-medium text-primary mb-px">DOCS</span>
      ) : null}
    </>
  )
}

const MobileHeaderLogo = ({ scrolledTitle }: { scrolledTitle?: string | null }) => {
  // the large logo is taller than the reel, so it does not roll
  if (largeLogo) return <HeaderLogo />

  return (
    <Link
      href="/"
      aria-label={scrolledTitle ? `${scrolledTitle}, Supabase docs` : 'Supabase docs'}
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
