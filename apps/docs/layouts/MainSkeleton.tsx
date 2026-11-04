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
  useCloseMenuOnRouteChange,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.utils'
import { DesktopTopNavBar, MobileTopNavBar } from '~/components/Navigation/NavigationMenu/TopNavBar'
import { LegacyTopNavBar } from '~/components/Navigation/NavigationMenu/TopNavBar.legacy'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { useDocsPathname, useNavItems } from '~/features/IaNav'
import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import { menuState, useMenuMobileOpen } from '~/hooks/useMenuState'
import { HeadingSlotProvider } from '~/layouts/HeadingSlot'
import { MobileHeaderSlotsContext } from '~/layouts/MobileHeaderSlots'
import { RightRailProvider } from '~/layouts/RightRail'
import { SidebarTopSlotProvider, useSidebarTopSlot } from '~/layouts/SidebarTopSlot'
import { UpdatedAtSlotProvider } from '~/layouts/UpdatedAtSlot'
// End of third-party imports

import { isFeatureEnabled } from 'common'
import dynamic from 'next/dynamic'
import {
  memo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
} from 'react'
import { cn, ScrollBar, ScrollRoot, ScrollViewport } from 'ui'
import { MobileNavLock } from 'ui-patterns/MobileNav/MobileNavLock'

interface NavContainerProps extends PropsWithChildren {
  toggleRef: RefObject<HTMLElement | null>
  className?: string
}

const Footer = dynamic(() => import('~/components/Navigation/Footer').then((mod) => mod.Footer))
const LegacyFooter = dynamic(() =>
  import('~/components/Navigation/Footer.legacy').then((mod) => mod.LegacyFooter)
)
const GlobalMenuDrawerSection = dynamic(() =>
  import('~/components/Navigation/NavigationMenu/GlobalMenuDrawer').then(
    (mod) => mod.GlobalMenuDrawerSection
  )
)
const GlobalMenuDrawerFooter = dynamic(() =>
  import('~/components/Navigation/NavigationMenu/GlobalMenuDrawer').then(
    (mod) => mod.GlobalMenuDrawerFooter
  )
)

const footerEnabled = isFeatureEnabled('docs:footer')

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

const NavContainer = memo(function NavContainer({
  children,
  toggleRef,
  className,
}: NavContainerProps) {
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
        'lg:border-r',
        className
      )}
    >
      {mobileMenuOpen ? <MobileNavLock toggleRef={toggleRef} /> : null}
      <div ref={setTopSlot} className="hidden lg:block shrink-0" />
      <div className="hidden lg:block shrink-0 px-4 bg-background">
        <DocsSidebarNavTop className="-mx-4 flex border-b px-4 py-2.5" />
      </div>
      <ScrollRoot className="flex min-h-0 flex-1 flex-col">
        <ScrollViewport
          className={cn(
            'relative',
            'overscroll-contain',
            'lg:backdrop-blur-sm lg:backdrop-filter bg-background'
          )}
        >
          <span id="main-nav-title" className="sr-only">
            Main menu
          </span>
          <div
            className={cn(
              'transition-all ease-out duration-200',
              'px-6 pt-6 pb-16 lg:pb-32',
              'bg-background',
              // desktop styles
              'lg:pb-10 lg:px-4 lg:pt-0 lg:flex lg:flex-col',
              'lg:opacity-100 lg:visible'
            )}
          >
            <div className="lg:pl-2">
              <DocsSidebarNav>{children}</DocsSidebarNav>
            </div>
          </div>
        </ScrollViewport>
        <ScrollBar />
      </ScrollRoot>
      <GlobalMenuDrawerFooter className="shrink-0 border-t bg-background px-6 py-4 lg:hidden" />
      <DocsSidebarResources className="hidden lg:flex shrink-0 border-t py-3 pl-6 pr-4" />
    </nav>
  )
})

// legacy sidebar for docs-layout-v2 off. delete it with the flag
const LegacyNavContainer = memo(function LegacyNavContainer({
  children,
  toggleRef,
  className,
}: NavContainerProps) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <nav
      aria-labelledby="main-nav-title"
      data-docs-nav="sidebar"
      className={cn(
        'fixed lg:relative z-40 lg:z-auto',
        'inset-x-0 top-(--header-height) overflow-hidden',
        'h-[calc(100dvh-var(--header-height))]',
        !mobileMenuOpen && 'max-lg:hidden',
        'lg:w-[420px] layout-v2:lg:w-(--docs-side-column-width) layout-v2:lg:shrink-0 lg:left-0',
        'lg:top-(--header-height) lg:sticky',
        'lg:h-[calc(100vh-var(--header-height))]',
        'flex flex-col ml-0',
        'lg:border-r',
        'lg:overflow-y-auto',
        className
      )}
    >
      {mobileMenuOpen ? <MobileNavLock toggleRef={toggleRef} /> : null}
      <ScrollRoot className="flex min-h-0 flex-1 flex-col">
        <ScrollViewport
          className={cn(
            'relative',
            'overscroll-contain',
            'lg:backdrop-blur-sm lg:backdrop-filter bg-background'
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
              'px-6 pt-6 pb-16 lg:pb-32',
              'bg-background',
              // desktop styles
              'lg:pb-10 lg:px-10 lg:flex',
              'lg:opacity-100 lg:visible'
            )}
          >
            {children}
          </div>
        </ScrollViewport>
        <ScrollBar />
      </ScrollRoot>
      <GlobalMenuDrawerFooter className="shrink-0 border-t bg-background px-6 py-4 lg:hidden" />
    </nav>
  )
})

interface SkeletonSideNavProps extends PropsWithChildren {
  toggleRef: RefObject<HTMLElement | null>
  menuId?: MenuId
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
  className?: string
}

interface SkeletonRightRailProps {
  hasRightRail: boolean
  onTargetChange: (target: HTMLElement | null) => void
}

interface SkeletonProps extends PropsWithChildren {
  menuId?: MenuId
  hideSideNav?: boolean
  hasRightRail?: boolean
  NavigationMenu?: ReactNode
  hideFooter?: boolean
  className?: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}

const SkeletonSideNav = ({
  toggleRef,
  menuId,
  additionalNavItems,
  className,
  children,
}: SkeletonSideNavProps) =>
  useDocsLayoutV2() ? (
    <DocsSidebarNavProvider menuId={menuId} additionalNavItems={additionalNavItems}>
      <NavContainer toggleRef={toggleRef} className={className}>
        {children}
      </NavContainer>
    </DocsSidebarNavProvider>
  ) : (
    <LegacyNavContainer toggleRef={toggleRef} className={className}>
      {children}
    </LegacyNavContainer>
  )

const SkeletonFooter = () => (useDocsLayoutV2() ? <Footer className="mt-16" /> : <LegacyFooter />)

// the server renders the legacy layout, so css shows the rail from the pre-paint layout attribute
const SkeletonRightRail = ({ hasRightRail, onTargetChange }: SkeletonRightRailProps) => {
  const isLayoutV2 = useDocsLayoutV2()
  if (!hasRightRail) return null

  return (
    <aside
      data-docs-right-rail
      className="hidden layout-v2:lg:block w-(--docs-side-column-width) shrink-0 border-l"
    >
      <div
        ref={isLayoutV2 ? onTargetChange : undefined}
        className="sticky top-(--header-height) flex h-[calc(100vh-var(--header-height))] flex-col"
      />
    </aside>
  )
}

function TopNavSkeleton({ children }: PropsWithChildren) {
  const isLayoutV2 = useDocsLayoutV2()
  const [headingSlot, setHeadingSlot] = useState<HTMLElement | null>(null)
  const [updatedAtSlot, setUpdatedAtSlot] = useState<HTMLElement | null>(null)

  return (
    <HeadingSlotProvider value={headingSlot}>
      <UpdatedAtSlotProvider value={updatedAtSlot}>
        <SidebarTopSlotProvider>
          <div className="group/docs flex flex-col h-full w-full">
            <div className="hidden lg:sticky w-full lg:flex top-0 left-0 right-0 z-50">
              {isLayoutV2 ? (
                <DesktopTopNavBar
                  headingSlotRef={setHeadingSlot}
                  updatedAtSlotRef={setUpdatedAtSlot}
                />
              ) : (
                <LegacyTopNavBar />
              )}
            </div>
            {children}
          </div>
        </SidebarTopSlotProvider>
      </UpdatedAtSlotProvider>
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
  additionalNavItems,
}: SkeletonProps) {
  const isLayoutV2 = useDocsLayoutV2()
  const pathname = useDocsPathname()
  const menuId = _menuId ?? getMenuId(pathname)
  // the v2 docs home keeps the sidebar, so only the legacy layout hides it
  const isSideNavHidden = hideSideNav && !isLayoutV2

  const mobileMenuOpen = useMenuMobileOpen()
  const [tocSlot, setTocSlot] = useState<HTMLDivElement | null>(null)
  const [scrolledTitle, setScrolledTitle] = useState<string | null>(null)
  const [pickedGroupLabel, setPickedGroupLabel] = useState<string>()
  const [rightRailTarget, setRightRailTarget] = useState<HTMLElement | null>(null)
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  // getMenuId falls back to the getting started group, but a page without a sidebar is in no group
  const currentGroupLabel = hideSideNav ? undefined : getMenuGroupLabel(menuId, GLOBAL_MENU_ITEMS)
  // a page without a sidebar opens the drawer on the first group, so the drawer is never empty
  const defaultGroupLabel = hideSideNav
    ? GLOBAL_MENU_ITEMS.find(([section]) => section.enabled !== false)?.[0].label
    : currentGroupLabel
  const selectedGroupLabel = pickedGroupLabel ?? defaultGroupLabel
  // a page outside every group keeps its own nav, whichever group is picked
  const isSideNavShown = !currentGroupLabel || selectedGroupLabel === currentGroupLabel

  const handleMenuToggle = () => {
    // the menu opens on the current group again
    if (!mobileMenuOpen) setPickedGroupLabel(undefined)
    menuState.setMenuMobileOpen(!mobileMenuOpen)
  }

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const MobileBar = isLayoutV2 ? MobileTopNavBar : LegacyTopNavBar

  useCloseMenuOnRouteChange()

  const navigationMenu = (
    <>
      <GlobalMenuDrawerSection
        selectedLabel={selectedGroupLabel}
        currentLabel={currentGroupLabel}
        currentLevel={menuId}
        onGroupPick={setPickedGroupLabel}
        className={cn('lg:hidden', !isSideNavHidden && isSideNavShown && 'mb-6 border-b pb-6')}
      />
      {isSideNavHidden ? null : (
        <div className={cn('lg:contents', !isSideNavShown && 'max-lg:hidden')}>
          {NavigationMenu ?? (
            <DefaultNavigationMenu menuId={menuId} additionalNavItems={additionalNavItems} />
          )}
        </div>
      )}
    </>
  )

  return (
    <RightRailProvider value={rightRailTarget}>
      <div className={cn('flex flex-row h-full relative', className)}>
        <SkeletonSideNav
          toggleRef={menuButtonRef}
          menuId={hideSideNav ? undefined : menuId}
          additionalNavItems={additionalNavItems}
          className={cn(hideSideNav && 'lg:hidden layout-v2:lg:flex')}
        >
          {navigationMenu}
        </SkeletonSideNav>
        <Container>
          <div className="sticky top-0 z-20 lg:hidden">
            <MobileBar
              isMenuOpen={mobileMenuOpen}
              onMenuToggle={handleMenuToggle}
              scrolledTitle={mobileMenuOpen ? null : scrolledTitle}
              menuButtonRef={menuButtonRef}
            />
            <div ref={setTocSlot} className="md:hidden" />
          </div>
          <div className="grow">
            <MobileHeaderSlotsContext value={{ tocSlot, onTitleScroll: setScrolledTitle }}>
              {children}
            </MobileHeaderSlotsContext>
            {hideFooter ? null : <SkeletonFooter />}
          </div>
        </Container>
        <SkeletonRightRail hasRightRail={hasRightRail} onTargetChange={setRightRailTarget} />
      </div>
    </RightRailProvider>
  )
}

export { SidebarSkeleton, TopNavSkeleton }
