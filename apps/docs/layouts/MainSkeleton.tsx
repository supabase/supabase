'use client'

import type { NavMenuSection } from '~/components/Navigation/Navigation.types'
import {
  DocsSidebarNav,
  DocsSidebarNavProvider,
  DocsSidebarNavTop,
  DocsSidebarResources,
} from '~/components/Navigation/NavigationMenu/DocsSidebarNav'
import DefaultNavigationMenu, {
  type MenuId,
} from '~/components/Navigation/NavigationMenu/NavigationMenu'
import {
  getMenuGroupLabel,
  getMenuId,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.utils'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'
import { LegacyTopNavBar } from '~/components/Navigation/NavigationMenu/TopNavBar.legacy'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { useNavItems } from '~/features/IaNav'
import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import { menuState, useMenuMobileOpen } from '~/hooks/useMenuState'
import { HeadingSlotProvider } from '~/layouts/HeadingSlot'
import { MobileHeaderSlotsContext } from '~/layouts/MobileHeaderSlots'
import { RightRailProvider } from '~/layouts/RightRail'
import { SidebarTopSlotProvider, useSidebarTopSlot } from '~/layouts/SidebarTopSlot'
// End of third-party imports

import { isFeatureEnabled } from 'common'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import {
  memo,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
} from 'react'
import { cn } from 'ui'
import { MobileNavLock } from 'ui-patterns/MobileNav/MobileNavLock'

interface NavContainerProps extends PropsWithChildren {
  toggleRef: RefObject<HTMLElement | null>
}

const Footer = dynamic(() => import('~/components/Navigation/Footer'))
const LegacyFooter = dynamic(() =>
  import('~/components/Navigation/Footer.legacy').then((mod) => mod.LegacyFooter)
)
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
        'w-full layout-v2:min-w-0 transition-all ease-out relative scroll-mt-(--header-height) outline-hidden',
        // desktop override any margin styles
        'lg:ml-0',
        className
      )}
    >
      <div className="flex flex-col sticky top-0">{children}</div>
    </main>
  )
})

const NavContainer = memo(function NavContainer({ children, toggleRef }: NavContainerProps) {
  const mobileMenuOpen = useMenuMobileOpen()
  const { setTarget: setTopSlot } = useSidebarTopSlot()

  return (
    <nav
      aria-labelledby="main-nav-title"
      data-docs-sidebar
      className={cn(
        'fixed lg:relative z-40 lg:z-auto',
        'inset-x-0 top-(--header-height) overflow-hidden',
        'h-[calc(100dvh-var(--header-height))]',
        !mobileMenuOpen && 'max-lg:hidden',
        'lg:w-(--docs-side-column-width) lg:shrink-0 lg:left-0',
        'lg:top-(--header-height) lg:sticky',
        'lg:h-[calc(100vh-var(--header-height))]',
        'flex flex-col ml-0',
        'lg:border-r'
      )}
    >
      {mobileMenuOpen ? <MobileNavLock toggleRef={toggleRef} /> : null}
      <div ref={setTopSlot} className="hidden lg:block shrink-0" />
      <div className="hidden lg:block shrink-0 px-4 bg-background">
        <DocsSidebarNavTop className="-mx-4 flex border-b py-2.5 pl-5 pr-4" />
      </div>
      <div
        className={cn(
          'top-0',
          'h-full',
          'relative',
          'w-full lg:w-auto',
          'h-fit lg:h-auto lg:min-h-0 lg:flex-1 overflow-x-hidden overflow-y-scroll lg:overflow-y-auto thin-scrollbar',
          'overscroll-contain',
          'lg:backdrop-blur-sm lg:backdrop-filter bg-background',
          'flex flex-col flex-1 min-h-0'
        )}
      >
        <span id="main-nav-title" className="sr-only">
          Main menu
        </span>
        <div
          className={cn(
            'transition-all ease-out duration-200',
            'absolute left-0 right-0',
            'px-6 pt-6 pb-16 lg:pb-32',
            'bg-background',
            // desktop styles
            'lg:relative lg:left-0 lg:pb-10 lg:px-4 lg:pt-0 lg:flex lg:flex-col',
            'lg:opacity-100 lg:visible'
          )}
        >
          <div className="lg:pl-2">
            <DocsSidebarNav>{children}</DocsSidebarNav>
          </div>
        </div>
      </div>
      <GlobalMenuDrawerFooter className="shrink-0 border-t bg-background px-6 py-4 lg:hidden" />
      <DocsSidebarResources className="hidden lg:flex shrink-0 border-t py-3 pl-6 pr-4" />
    </nav>
  )
})

// master's sidebar, kept for docs-layout-v2 off. delete it with the flag
const LegacyNavContainer = memo(function LegacyNavContainer({
  children,
  toggleRef,
}: PropsWithChildren<{ toggleRef: RefObject<HTMLElement | null> }>) {
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
      {mobileMenuOpen ? <MobileNavLock toggleRef={toggleRef} /> : null}
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

interface SkeletonSideNavProps extends PropsWithChildren {
  toggleRef: RefObject<HTMLElement | null>
  hasSectionMenu: boolean
}

interface SkeletonRightRailProps {
  hasRightRail: boolean
  rightRail?: ReactNode
  onTargetChange: (target: HTMLElement | null) => void
}

interface SkeletonProps extends PropsWithChildren {
  menuId?: MenuId
  hideSideNav?: boolean
  hasRightRail?: boolean
  rightRail?: ReactNode
  NavigationMenu?: ReactNode
  hideFooter?: boolean
  className?: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}

const SkeletonSideNav = ({ toggleRef, hasSectionMenu, children }: SkeletonSideNavProps) =>
  useDocsLayoutV2() ? (
    <DocsSidebarNavProvider hasSectionMenu={hasSectionMenu}>
      <NavContainer toggleRef={toggleRef}>{children}</NavContainer>
    </DocsSidebarNavProvider>
  ) : (
    <LegacyNavContainer toggleRef={toggleRef}>{children}</LegacyNavContainer>
  )

const SkeletonFooter = () => (useDocsLayoutV2() ? <Footer /> : <LegacyFooter />)

const SkeletonRightRail = ({ hasRightRail, rightRail, onTargetChange }: SkeletonRightRailProps) => {
  const isLayoutV2 = useDocsLayoutV2()
  if (!isLayoutV2 || !(hasRightRail || rightRail)) return null

  return (
    <aside
      data-docs-right-rail
      className="hidden lg:block w-(--docs-side-column-width) shrink-0 border-l"
    >
      <div
        ref={onTargetChange}
        className="sticky top-(--header-height) max-h-[calc(100vh-var(--header-height))] overflow-y-auto thin-scrollbar p-6"
      >
        {rightRail}
      </div>
    </aside>
  )
}

function TopNavSkeleton({ children }) {
  const isLayoutV2 = useDocsLayoutV2()
  // the docs home has no sidebar, so it keeps the bar with the section menus
  const isHome = usePathname() === '/'
  const [headingSlot, setHeadingSlot] = useState<HTMLElement | null>(null)

  return (
    <HeadingSlotProvider value={headingSlot}>
      <SidebarTopSlotProvider>
        <div className="group/docs flex flex-col h-full w-full">
          <div className="hidden lg:sticky w-full lg:flex top-0 left-0 right-0 z-50">
            {isLayoutV2 && !isHome ? (
              <TopNavBar headingSlotRef={setHeadingSlot} />
            ) : (
              <LegacyTopNavBar />
            )}
          </div>
          {children}
        </div>
      </SidebarTopSlotProvider>
    </HeadingSlotProvider>
  )
}

function SidebarSkeleton({
  children,
  menuId: _menuId,
  NavigationMenu,
  hideFooter = !footerEnabled,
  className,
  hideSideNav,
  hasRightRail = false,
  rightRail,
  additionalNavItems,
}: SkeletonProps) {
  const isLayoutV2 = useDocsLayoutV2()
  const pathname = usePathname()
  const menuId = _menuId ?? getMenuId(pathname)

  const mobileMenuOpen = useMenuMobileOpen()
  const [tocSlot, setTocSlot] = useState<HTMLDivElement | null>(null)
  const [scrolledTitle, setScrolledTitle] = useState<string | null>(null)
  const [pickedGroupLabel, setPickedGroupLabel] = useState<string>()
  const [rightRailTarget, setRightRailTarget] = useState<HTMLElement | null>(null)
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  const currentGroupLabel = getMenuGroupLabel(menuId, GLOBAL_MENU_ITEMS)
  const selectedGroupLabel = pickedGroupLabel ?? currentGroupLabel
  // a page outside every group keeps its own nav, whichever group is picked
  const isSideNavShown = !currentGroupLabel || selectedGroupLabel === currentGroupLabel

  const handleMenuToggle = () => {
    // the menu opens on the current group again
    if (!mobileMenuOpen) setPickedGroupLabel(undefined)
    menuState.setMenuMobileOpen(!mobileMenuOpen)
  }

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const MobileTopNavBar = isLayoutV2 ? TopNavBar : LegacyTopNavBar

  const navigationMenu = (
    <>
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
    </>
  )

  return (
    <RightRailProvider value={rightRailTarget}>
      <div className={cn('flex flex-row h-full relative', className)}>
        {hideSideNav ? null : (
          <SkeletonSideNav toggleRef={menuButtonRef} hasSectionMenu={!rightRail}>
            {navigationMenu}
          </SkeletonSideNav>
        )}
        <Container>
          <div className="sticky top-0 z-20 lg:hidden">
            <MobileTopNavBar
              isMenuOpen={mobileMenuOpen}
              onMenuToggle={hideSideNav ? undefined : handleMenuToggle}
              scrolledTitle={mobileMenuOpen ? null : scrolledTitle}
              menuButtonRef={menuButtonRef}
            />
            <div ref={setTocSlot} className={isLayoutV2 ? undefined : 'md:hidden'} />
          </div>
          <div className="grow">
            <MobileHeaderSlotsContext value={{ tocSlot, onTitleScroll: setScrolledTitle }}>
              {children}
            </MobileHeaderSlotsContext>
            {hideFooter ? null : <SkeletonFooter />}
          </div>
          <MobileMenuBackdrop />
        </Container>
        <SkeletonRightRail
          hasRightRail={hasRightRail}
          rightRail={rightRail}
          onTargetChange={setRightRailTarget}
        />
      </div>
    </RightRailProvider>
  )
}

export { SidebarSkeleton, TopNavSkeleton }
