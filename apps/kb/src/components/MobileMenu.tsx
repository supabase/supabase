import { X } from 'lucide-react'
import { type KeyboardEvent } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  cn,
  singleThemes,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'

import { SIGN_UP_URL, type NavMenu } from '../lib/nav'
import { revealStyle } from '../lib/reveal'
import { EXTERNAL_LINKS, useThemeChoice } from './HeaderMenu'
import { Logo } from './Logo'

export interface MobileMenuProps {
  id: string
  menus: NavMenu[]
  onClose: () => void
  className?: string
}

export const MobileMenu = ({ id, menus, onClose, className }: MobileMenuProps) => {
  const { choice, onChoiceChange } = useThemeChoice()

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose()
    if (event.key !== 'Tab') return
    // aria-modal doesn't stop Tab, so wrap focus between the first and last focusable element
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // the menu only exists below lg, so close it once the viewport grows past that
  const bindDesktopClose = (dialog: HTMLDivElement | null) => {
    if (!dialog) return
    const desktop = window.matchMedia('(width >= 64rem)')
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose()
    }
    desktop.addEventListener('change', handleDesktopChange)
    return () => desktop.removeEventListener('change', handleDesktopChange)
  }

  return (
    <div
      ref={bindDesktopClose}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onKeyDown={handleKeyDown}
      className={cn(
        'fixed inset-0 z-50 flex h-svh flex-col bg-overlay',
        'transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none',
        className
      )}
    >
      <div className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-transparent px-6">
        <Logo />
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground-lighter hover:text-foreground-light focus-ring"
        >
          <span className="sr-only">Close menu</span>
          <X aria-hidden className="size-6" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4">
        <Accordion type="multiple">
          {menus.map((menu, index) => (
            <AccordionItem
              key={menu.label}
              value={menu.label}
              style={revealStyle(index)}
              className={cn(
                'border-b transition-[opacity,translate] duration-250 ease-out',
                'delay-[calc(var(--reveal-index)*50ms)] motion-reduce:transition-none',
                'starting:translate-y-2.5 starting:opacity-0'
              )}
            >
              <AccordionTrigger className="py-2 pl-2 pr-4 text-base font-medium text-foreground hover:bg-surface-200">
                {menu.label}
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="flex flex-col gap-5 px-3 pb-4">
                  {menu.groups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-3">
                      {menu.groups.length > 1 ? (
                        <span className="font-mono text-xs uppercase tracking-widest text-foreground-lighter">
                          {group.label}
                        </span>
                      ) : null}
                      <ul className="flex flex-col gap-3">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              className="rounded-sm text-sm text-foreground-light hover:text-foreground focus-ring"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <ul className="mt-auto flex flex-col gap-3 px-2 pt-6">
          {EXTERNAL_LINKS.map(({ label, href, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 rounded-sm text-sm text-foreground-light hover:text-foreground focus-ring"
              >
                <Icon aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="px-2 pt-6">
          <ToggleGroup
            type="single"
            variant="segmented"
            tone="outline"
            size="sm"
            allowDeselect={false}
            value={choice}
            onValueChange={onChoiceChange}
            aria-label="Theme"
            className="w-full"
          >
            {singleThemes.map((theme) => (
              <ToggleGroupItem key={theme.value} value={theme.value} className="flex-1">
                {theme.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="flex shrink-0 bg-alternative p-4">
        <Button variant="primary" block asChild>
          <a href={SIGN_UP_URL} className="h-10 py-4">
            Start your project
          </a>
        </Button>
      </div>
    </div>
  )
}
