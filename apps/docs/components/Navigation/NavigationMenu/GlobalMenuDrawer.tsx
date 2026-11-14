import { useIsLoggedIn, useIsUserLoading } from 'common'
import Link from 'next/link'
import { Fragment } from 'react'
import { Button, cn } from 'ui'
import { MobileNavTabs } from 'ui-patterns/MobileNav/MobileNavTabs'

import type { DropdownMenuItem } from '../Navigation.types'
import { MenuItem } from './GlobalNavigationMenu'
import NavigationMenu, { MenuId } from './NavigationMenu'
import { isMenuLevel } from './NavigationMenu.utils'
import { IA_NAV_PENDING_CLASS, useIaNavReady, useNavItems } from '@/features/IaNav'

const SectionMenuItems = ({
  section,
  activeLevel,
}: {
  section: DropdownMenuItem[]
  activeLevel: string
}) =>
  section[0].menuItems?.map((menuItem, menuItemIndex) => (
    <Fragment key={`desktop-docs-menu-section-${menuItemIndex}`}>
      {menuItem
        .filter((item) => item.enabled !== false)
        .map((item) =>
          !item.href ? (
            <div
              key={item.label}
              className="font-mono tracking-wider flex items-center text-foreground-muted text-xs uppercase rounded-md py-2 leading-none"
            >
              {item.label}
            </div>
          ) : (
            <MenuItem
              key={item.label}
              className="h-8 px-0 aria-[current=true]:text-primary aria-[current=true]:**:text-primary"
              // the item is the section of the open page, not the page itself
              aria-current={isMenuLevel(activeLevel, item.level) ? 'true' : undefined}
              href={item.href}
              title={item.label}
              community={item.community}
              new={item.new}
              experimental={item.experimental}
              icon={item.icon}
            />
          )
        )}
    </Fragment>
  ))

const GlobalMenuAccountActions = () => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()

  if (isUserLoading) return null

  return isLoggedIn ? (
    <Button block className="h-8 text-sm" asChild>
      <Link href="https://supabase.com/dashboard/projects">Dashboard</Link>
    </Button>
  ) : (
    <>
      <Button block className="h-8 text-sm" asChild>
        <Link href="https://supabase.com/dashboard/sign-in">Sign in</Link>
      </Button>
      <Button variant="primary" block className="h-8 text-sm" asChild>
        <Link href="https://supabase.com/dashboard/sign-up">Start your project</Link>
      </Button>
    </>
  )
}

// the header has one burger, so the sidebar drawer also holds the top nav groups
export const GlobalMenuDrawerSection = ({
  selectedLabel,
  currentLabel,
  currentLevel,
  onGroupPick,
  className,
}: {
  selectedLabel: string | undefined
  currentLabel: string | undefined
  currentLevel: string
  onGroupPick: (label: string) => void
  className?: string
}) => {
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  const isNavReady = useIaNavReady()
  const sections = GLOBAL_MENU_ITEMS.filter((section) => section[0].enabled !== false)
  const selectedSection = sections.find((section) => section[0].label === selectedLabel)
  // a group without menu items, such as start, opens its own sidebar nav in place
  const selectedMenuId = Object.values(MenuId).find((id) => id === selectedSection?.[0].level)

  return (
    <section
      aria-label="All docs"
      className={cn('flex flex-col gap-3', !isNavReady && IA_NAV_PENDING_CLASS, className)}
    >
      <MobileNavTabs
        tabs={sections.map(([section]) => ({
          label: section.label,
          href: section.menuItems || section.level ? undefined : section.href,
        }))}
        selectedLabel={selectedLabel}
        currentLabel={currentLabel}
        onTabSelect={onGroupPick}
        placeholder="Sections"
        linkAs={Link}
      />
      {selectedSection?.[0].menuItems ? (
        <div>
          <SectionMenuItems section={selectedSection} activeLevel={currentLevel} />
        </div>
      ) : selectedMenuId ? (
        <div>
          <MenuItem href={selectedSection?.[0].href} title="Overview" className="h-8 px-0" />
          {selectedLabel === currentLabel ? null : <NavigationMenu menuId={selectedMenuId} />}
        </div>
      ) : null}
    </section>
  )
}

export const GlobalMenuDrawerFooter = ({ className }: { className?: string }) => (
  <div className={cn('flex items-stretch gap-4', className)}>
    <GlobalMenuAccountActions />
  </div>
)
