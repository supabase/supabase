import { useState, type KeyboardEvent } from 'react'
import { Button } from 'ui'
import { MobileNavDrawer } from 'ui-patterns/MobileNav/MobileNavDrawer'
import { MobileNavTabs } from 'ui-patterns/MobileNav/MobileNavTabs'

import { SIGN_UP_URL, type NavMenu } from '../lib/nav'
import { EXTERNAL_LINKS } from './HeaderMenu'

export interface MobileMenuProps {
  id: string
  open: boolean
  menus: NavMenu[]
  currentPath: string
  onClose: () => void
  className?: string
}

export const MobileMenu = ({
  id,
  open,
  menus,
  currentPath,
  onClose,
  className,
}: MobileMenuProps) => {
  const [pickedLabel, setPickedLabel] = useState<string>()
  const [wasOpen, setWasOpen] = useState(open)
  // the menu opens on the tab that holds the current page again
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setPickedLabel(undefined)
  }

  const currentLabel = menus.find((menu) =>
    menu.groups.some((group) => group.links.some((link) => link.href === currentPath))
  )?.label
  const selectedLabel = pickedLabel ?? currentLabel ?? menus[0]?.label
  const selectedMenu = menus.find((menu) => menu.label === selectedLabel)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose()
  }

  // the menu only exists below lg, so close it once the viewport grows past that
  const bindDesktopClose = (drawer: HTMLDivElement | null) => {
    if (!drawer) return
    const desktop = window.matchMedia('(width >= 64rem)')
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose()
    }
    desktop.addEventListener('change', handleDesktopChange)
    return () => desktop.removeEventListener('change', handleDesktopChange)
  }

  return (
    <MobileNavDrawer
      ref={bindDesktopClose}
      id={id}
      open={open}
      onKeyDown={handleKeyDown}
      className={className}
      footer={
        <Button variant="primary" size="large" block asChild>
          <a href={SIGN_UP_URL}>Start your project</a>
        </Button>
      }
    >
      <nav aria-label="Menu" className="flex flex-col gap-6">
        <MobileNavTabs
          tabs={menus.map((menu) => ({ label: menu.label }))}
          selectedLabel={selectedLabel}
          currentLabel={currentLabel}
          onTabSelect={setPickedLabel}
        />
        {selectedMenu?.groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col">
            {selectedMenu.groups.length > 1 ? (
              <h2 className="py-2 font-mono text-xs uppercase tracking-widest text-foreground-lighter">
                {group.label}
              </h2>
            ) : null}
            <ul className="flex flex-col">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.href === currentPath ? 'page' : undefined}
                    className="flex h-10 items-center text-sm text-foreground-light hover:text-foreground focus-ring aria-[current=page]:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <ul className="flex flex-col border-t pt-4">
          {EXTERNAL_LINKS.map(({ label, href, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-10 items-center gap-2 text-sm text-foreground-light hover:text-foreground focus-ring"
              >
                <Icon aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MobileNavDrawer>
  )
}
