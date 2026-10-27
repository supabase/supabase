'use client'

import { type Menu } from '~/data/nav'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState, type ComponentProps, type MouseEvent, type RefObject } from 'react'
import { Button } from 'ui'
import { MobileNavDrawer } from 'ui-patterns/MobileNav/MobileNavDrawer'
import { MobileNavTabs } from 'ui-patterns/MobileNav/MobileNavTabs'
import { TextLink } from 'ui-patterns/TextLink'

import MenuItem from './MenuItem'
import staticContent from '@/.generated/staticContent/_index.json'
import ProductModulesData from '@/data/ProductModules'
import { isCrossZoneHref } from '@/lib/cross-zone'
import { useSendTelemetryEvent } from '@/lib/telemetry'

interface MobileMenuProps {
  open: boolean
  menu: Menu
  toggleRef: RefObject<HTMLElement | null>
  onLinkClick: () => void
  className?: string
}

export const MobileMenu = ({ open, menu, toggleRef, onLinkClick, className }: MobileMenuProps) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [pickedTitle, setPickedTitle] = useState<string>(menu.primaryNav[0].title)
  const pickedItem = menu.primaryNav.find((menuItem) => menuItem.title === pickedTitle)

  // the tab dropdown renders in a portal, but its react events still reach the drawer
  const handleDrawerClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('a')) onLinkClick()
  }

  return (
    <MobileNavDrawer
      open={open}
      toggleRef={toggleRef}
      onClick={handleDrawerClick}
      className={className}
      footer={
        isUserLoading ? null : (
          <div className="flex items-stretch gap-4">
            {isLoggedIn ? (
              <Button block asChild>
                <a type={undefined} className="h-10 py-4" href="/dashboard/projects">
                  Dashboard
                </a>
              </Button>
            ) : (
              <>
                <Button block asChild>
                  <a
                    type={undefined}
                    className="h-10 py-4"
                    href="https://supabase.com/dashboard"
                    onClick={() =>
                      sendTelemetryEvent({
                        action: 'sign_in_button_clicked',
                        properties: { buttonLocation: 'Mobile Nav' },
                      })
                    }
                  >
                    Sign in
                  </a>
                </Button>
                <Button variant="primary" block asChild>
                  <a
                    type={undefined}
                    className="h-10 py-4"
                    href="https://supabase.com/dashboard/sign-up"
                    onClick={() =>
                      sendTelemetryEvent({
                        action: 'start_project_button_clicked',
                        properties: { buttonLocation: 'Mobile Nav' },
                      })
                    }
                  >
                    Start your project
                  </a>
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      <nav aria-label="Menu" className="flex flex-col gap-6">
        <MobileNavTabs
          tabs={menu.primaryNav.map((menuItem) => ({
            label: menuItem.title,
            href: menuItem.hasDropdown ? undefined : menuItem.url,
          }))}
          selectedLabel={pickedTitle}
          onTabSelect={setPickedTitle}
          linkAs={NavLink}
        />
        {pickedItem?.hasDropdown ? <SubMenu menuItem={pickedItem} /> : null}
      </nav>
    </MobileNavDrawer>
  )
}

const NavLink = ({ href = '', ...props }: ComponentProps<'a'>) =>
  isCrossZoneHref(href) ? <a href={href} {...props} /> : <Link href={href} {...props} />

const SubMenu = ({ menuItem }: { menuItem: Menu['primaryNav'][number] }) => {
  const { jobsCount } = staticContent

  return menuItem.title === 'Product' ? (
    <>
      {Object.values(menuItem.subMenu)?.map((component) => (
        <MenuItem
          key={component.name}
          title={component.name}
          href={component.url}
          description={component.description_short}
          icon={component.icon}
          badge={
            component.name === 'Compute'
              ? { label: 'Private Alpha', variant: 'default' }
              : undefined
          }
        />
      ))}
      <div>
        <div className="group flex items-center p-2 text-foreground-lighter text-xs uppercase tracking-widest font-mono">
          Modules
        </div>
        <ul className="flex flex-col gap-0">
          {Object.values(ProductModulesData).map((productModule) => (
            <li key={productModule.name}>
              <MenuItem
                title={productModule.name}
                href={productModule.url}
                description={productModule.description_short}
                icon={productModule.icon}
              />
            </li>
          ))}
        </ul>
      </div>
      <Link
        href="/features"
        className="
            flex items-center justify-between group text-sm
            p-4 mt-4 gap-2
            rounded-lg border
            bg-alternative-200 text-foreground-light
            hover:text-foreground hover:border-foreground-muted
            focus-visible:text-foreground focus-ring
          "
      >
        <div className="flex flex-col gap-1 leading-3!">
          <span>Features</span>
          <span className="text-foreground-lighter text-xs leading-4">
            Explore everything you can do with Supabase.
          </span>
        </div>
        <ChevronRight
          strokeWidth={2}
          className="w-3 -ml-1 transition-all will-change-transform -translate-x-1 opacity-80 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </Link>
    </>
  ) : menuItem.title === 'Developers' ? (
    <div className="px-3 mb-2 flex flex-col gap-6">
      {menuItem.subMenu['navigation'].map((column) => (
        <div key={column.label} className="flex flex-col gap-3">
          {column.label !== 'Developers' && (
            <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              {column.label}
            </label>
          )}
          {column.links.map((link) => (
            <TextLink
              hasChevron={false}
              key={link.text}
              url={link.url}
              label={link.text}
              counter={link.text === 'Careers' && jobsCount > 0 ? jobsCount : undefined}
              className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay mt-0!"
            />
          ))}
        </div>
      ))}

      <div className="flex flex-col py-2">
        <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
          Troubleshooting
        </label>
        <TextLink
          hasChevron={false}
          url={menuItem.subMenu['footer']['support'].url}
          label={menuItem.subMenu['footer']['support'].text}
          className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
        />
        <TextLink
          hasChevron={false}
          url={menuItem.subMenu['footer']['systemStatus'].url}
          label={menuItem.subMenu['footer']['systemStatus'].text}
          className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
        />
      </div>
    </div>
  ) : menuItem.title === 'Solutions' ? (
    <div className="px-3 mb-2 flex flex-col gap-6">
      {menuItem.subMenu['navigation'].map((column) => (
        <div key={column.label} className="flex flex-col gap-3">
          {column.label !== 'Solutions' && (
            <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              {column.label}
            </label>
          )}
          {column.links.map((link) => (
            <TextLink
              hasChevron={false}
              key={link.text}
              url={link.url}
              label={link.text}
              className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay mt-0!"
            />
          ))}
        </div>
      ))}
    </div>
  ) : null
}
