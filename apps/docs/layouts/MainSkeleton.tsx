'use client'

import type { NavMenuSection } from '~/components/Navigation/Navigation.types'
import DefaultNavigationMenu, {
  type MenuId,
} from '~/components/Navigation/NavigationMenu/NavigationMenu'
import {
  getMenuGroupLabel,
  getMenuId,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.utils'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'
import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import { menuState, useMenuMobileOpen } from '~/hooks/useMenuState'
import { MobileHeaderSlotsContext } from '~/layouts/MobileHeaderSlots'
// End of third-party imports

import { isFeatureEnabled } from 'common'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { memo, useEffect, useState, type PropsWithChildren, type ReactNode } from 'react'
import { cn } from 'ui'

const Footer = dynamic(() => import('~/components/Navigation/Footer'))
const GlobalMenuDrawerSection = dynamic(() =>
  import('~/components/Navigation/NavigationMenu/GlobalMobileMenu').then(
    (mod) => mod.GlobalMenuDrawerSection
  )
)
const GlobalMenuDrawerFooter = dynamic(() =>
  import('~/components/Navigation/NavigationMenu/GlobalMobileMenu').then(
    (mod) => mod.GlobalMenuDrawerFooter
  )
)

const footerEnabled = isFeatureEnabled('docs:footer')

const MobileMenuBackdrop = memo(function MobileMenuBackdrop() {
  const mobileMenuOpen = useMenuMobileOpen()

  useEffect(() => {
    window.addEventListener('resize', (e: UIEvent) => {
      const w = e.target as Window
      if (mobileMenuOpen && w.innerWidth >= 1024) {
        menuState.setMenuMobileOpen(!mobileMenuOpen)
      }
    })
    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [mobileMenuOpen])

  return (
    <div
      className={cn(
        'h-full',
        'left-0',
        'right-0',
        'z-10',
        'bg-alternative/90',
        mobileMenuOpen ? 'absolute h-full w-full top-0 left-0' : 'hidden h-0',
        // always hide on desktop
        'lg:hidden'
      )}
      onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
    ></div>
  )
})

const Container = memo(function Container({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <main
      // used by layout to scroll to top
      id={DOCS_CONTENT_CONTAINER_ID}
      tabIndex={-1}
      className={cn(
        'w-full transition-all ease-out relative scroll-mt-(--header-height) outline-hidden',
        // desktop override any margin styles
        'lg:ml-0',
        className
      )}
    >
      <div className="flex flex-col sticky top-0">{children}</div>
    </main>
  )
})

const NavContainer = memo(function NavContainer({ children }: PropsWithChildren) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <nav
      aria-labelledby="main-nav-title"
      className={cn(
        'fixed lg:relative z-40 lg:z-auto',
        'inset-x-0 top-(--header-height) overflow-hidden',
        'h-[calc(100dvh-var(--header-height))]',
        !mobileMenuOpen && 'max-lg:hidden',
        'lg:w-[420px] lg:left-0',
        'lg:top-(--header-height) lg:sticky',
        'lg:h-[calc(100vh-var(--header-height))]',
        'flex flex-col ml-0',
        'lg:border-r',
        'lg:overflow-y-auto'
      )}
    >
      <div
        className={cn(
          'top-0',
          'h-full',
          'relative',
          'w-full lg:w-auto',
          'h-fit lg:h-full overflow-y-scroll lg:overflow-auto',
          'overscroll-contain',
          'lg:backdrop-blur-sm lg:backdrop-filter bg-background',
          'flex flex-col flex-1 min-h-0'
        )}
      >
        <span id="main-nav-title" className="sr-only">
          Main menu
        </span>
        <div className="top-0 sticky h-0 z-10">
          <div className="bg-linear-to-b from-background to-transparent h-4 w-full"></div>
        </div>
        <div
          className={cn(
            'transition-all ease-out duration-200',
            'absolute left-0 right-0',
            'px-6 pt-6 pb-16 lg:pb-32',
            'bg-background',
            // desktop styles
            'lg:relative lg:left-0 lg:pb-10 lg:px-10 lg:flex',
            'lg:opacity-100 lg:visible'
          )}
        >
          {children}
        </div>
      </div>
      <GlobalMenuDrawerFooter className="shrink-0 border-t bg-background px-6 py-4 lg:hidden" />
    </nav>
  )
})

interface SkeletonProps extends PropsWithChildren {
  menuId?: MenuId
  hideSideNav?: boolean
  NavigationMenu?: ReactNode
  hideFooter?: boolean
  className?: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}

function TopNavSkeleton({ children }) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="hidden lg:sticky w-full lg:flex top-0 left-0 right-0 z-50">
        <TopNavBar />
      </div>
      {children}
    </div>
  )
}

function SidebarSkeleton({
  children,
  menuId: _menuId,
  NavigationMenu,
  hideFooter = !footerEnabled,
  className,
  hideSideNav,
  additionalNavItems,
}: SkeletonProps) {
  const pathname = usePathname()
  const menuId = _menuId ?? getMenuId(pathname)

  const mobileMenuOpen = useMenuMobileOpen()
  const [tocSlot, setTocSlot] = useState<HTMLDivElement | null>(null)
  const [pickedGroupLabel, setPickedGroupLabel] = useState<string>()
  const currentGroupLabel = getMenuGroupLabel(menuId)
  const selectedGroupLabel = pickedGroupLabel ?? currentGroupLabel
  const isSideNavShown = selectedGroupLabel === currentGroupLabel

  const handleMenuToggle = () => {
    // the menu opens on the current group again
    if (!mobileMenuOpen) setPickedGroupLabel(undefined)
    menuState.setMenuMobileOpen(!mobileMenuOpen)
  }

  return (
    <div className={cn('flex flex-row h-full relative', className)}>
      {!hideSideNav && (
        <NavContainer>
          <GlobalMenuDrawerSection
            selectedLabel={selectedGroupLabel}
            currentLabel={currentGroupLabel}
            currentLevel={menuId}
            onGroupPick={setPickedGroupLabel}
            className={cn('lg:hidden', isSideNavShown && 'mb-6 border-b pb-6')}
          />
          <div className={cn('lg:contents', !isSideNavShown && 'max-lg:hidden')}>
            {NavigationMenu ?? (
              <DefaultNavigationMenu menuId={menuId} additionalNavItems={additionalNavItems} />
            )}
          </div>
        </NavContainer>
      )}
      <Container>
        <div className="sticky top-0 z-20 lg:hidden">
          <TopNavBar
            isMenuOpen={mobileMenuOpen}
            onMenuToggle={hideSideNav ? undefined : handleMenuToggle}
          />
          <div ref={setTocSlot} inert={mobileMenuOpen} className="md:hidden" />
        </div>
        {/* the drawer covers the page, so tab stays in the header and the drawer */}
        <div inert={mobileMenuOpen} className="grow">
          <MobileHeaderSlotsContext value={{ tocSlot }}>{children}</MobileHeaderSlotsContext>
          {!hideFooter && <Footer />}
        </div>
        <MobileMenuBackdrop />
      </Container>
    </div>
  )
}

export { SidebarSkeleton, TopNavSkeleton }
