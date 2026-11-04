'use client'

import Link from 'next/link'
import React, { FC } from 'react'
import { Badge, cn } from 'ui'
import {
  TopNavMenu,
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuItem,
  TopNavMenuLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

import type { DropdownMenuItem, GlobalMenuItems } from '../Navigation.types'
import MenuIconPicker from './MenuIconPicker'
import { getMenuGroupLabelByPath } from './NavigationMenu.utils'
import { IA_NAV_PENDING_CLASS, useDocsPathname, useIaNavReady, useNavItems } from '@/features/IaNav'

const GlobalNavigationMenu: FC = () => {
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  const isNavReady = useIaNavReady()
  const pathname = useDocsPathname()
  const activeLabel = getMenuGroupLabelByPath({ menu: GLOBAL_MENU_ITEMS, pathname })
  const itemClassName = cn(!isNavReady && IA_NAV_PENDING_CLASS)

  return (
    <>
      <TopNavMenu data-docs-nav="top-nav" className="ml-3.5">
        {GLOBAL_MENU_ITEMS.filter(([section]) => section.enabled !== false).map(([section]) => {
          const label =
            section.label === 'Home' ? <MenuIconPicker icon={section.icon || ''} /> : section.label
          const ariaCurrent = activeLabel === section.label ? 'true' : undefined

          return section.menuItems ? (
            <TopNavMenuItem
              key={section.label}
              label={label}
              aria-current={ariaCurrent}
              className={itemClassName}
            >
              <TopNavMenuPanel>
                {section.menuItems.map((group, index) => (
                  <GlobalMenuGroup
                    key={group[0].label}
                    items={group}
                    fallbackLabel={index === 0 ? section.label : undefined}
                  />
                ))}
              </TopNavMenuPanel>
            </TopNavMenuItem>
          ) : (
            <TopNavMenuLink
              key={section.label}
              linkAs={Link}
              href={section.href || '#'}
              aria-current={ariaCurrent}
              className={itemClassName}
            >
              {label}
            </TopNavMenuLink>
          )
        })}
      </TopNavMenu>
      <GlobalMenuPanelsFallback menuItems={GLOBAL_MENU_ITEMS} />
    </>
  )
}

// the menu panels mount on the client, so their links are also rendered for readers without JavaScript
const GlobalMenuPanelsFallback = ({ menuItems }: { menuItems: GlobalMenuItems }) => (
  <noscript>
    <nav aria-label="Docs sections" data-docs-nav="top-nav-subheads" className="sr-only">
      {menuItems
        .filter(([section]) => section.enabled !== false && section.menuItems)
        .map(([section]) => (
          <section key={section.label}>
            <h2>{section.label}</h2>
            {section.menuItems?.map((group) => {
              const enabledItems = group.filter((item) => item.enabled !== false)
              const heading = enabledItems.find((item) => !item.href)?.label

              return (
                <ul key={group[0].label} aria-label={heading}>
                  {enabledItems.map((item) =>
                    item.href ? (
                      <li key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ) : null
                  )}
                </ul>
              )
            })}
          </section>
        ))}
    </nav>
  </noscript>
)

// an item without a link is the heading of its group. the first group falls back to the menu name
const GlobalMenuGroup = ({
  items,
  fallbackLabel,
}: {
  items: DropdownMenuItem[]
  fallbackLabel?: string
}) => {
  const enabledItems = items.filter((item) => item.enabled !== false)

  return (
    <TopNavMenuGroup label={enabledItems.find((item) => !item.href)?.label ?? fallbackLabel}>
      {enabledItems
        .filter((item) => item.href)
        .map((item) => (
          <TopNavMenuGroupLink key={item.href} linkAs={Link} href={item.href}>
            {item.label}
            {item.community ? <Badge>Community</Badge> : null}
            {item.new ? <Badge variant="success">New</Badge> : null}
            {item.experimental ? <Badge variant="warning">Experimental</Badge> : null}
          </TopNavMenuGroupLink>
        ))}
    </TopNavMenuGroup>
  )
}

export const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    icon?: string
    community?: boolean
    new?: boolean
    experimental?: boolean
  }
>(
  (
    { className, title, href = '', icon, community, new: isNew, experimental, children, ...props },
    ref
  ) => {
    return (
      <Link
        href={href}
        ref={ref}
        className={cn(
          'group/menu-item flex items-center gap-2',
          'w-full flex h-8 items-center text-foreground-light text-sm hover:text-foreground select-none rounded-md p-2 leading-none no-underline focus-ring focus-visible:text-foreground',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && <MenuIconPicker icon={icon} className="text-foreground-lighter" />}
            <span className="flex-1">{title}</span>
            {community && <Badge>Community</Badge>}
            {isNew && <Badge variant="success">New</Badge>}
            {experimental && <Badge variant="warning">Experimental</Badge>}
          </>
        )}
      </Link>
    )
  }
)

GlobalNavigationMenu.displayName = 'GlobalNavigationMenu'
MenuItem.displayName = 'MenuItem'

export default GlobalNavigationMenu
