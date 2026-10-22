import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, buttonVariants, cn } from 'ui'
import { MobileNavThemeButton } from 'ui-patterns/MobileNav/MobileNavThemeButton'

import { getNavMenus, SIGN_UP_URL } from '../lib/nav'
import type { Topic } from '../lib/topics'
import { HeaderMenu, useThemeChoice } from './HeaderMenu'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { Nav } from './Nav'

const MOBILE_MENU_ID = 'mobile-menu'

export interface HeaderProps {
  topics: Topic[]
  currentPath: string
}

export const Header = ({ topics, currentPath }: HeaderProps) => {
  const menus = getNavMenus(topics)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { choice, onChoiceChange } = useThemeChoice()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const setMenuOpen = (isOpen: boolean) => {
    setIsMenuOpen(isOpen)
    document.documentElement.toggleAttribute('data-mobile-menu-open', isOpen)
    // the drawer covers the page, so tab stays in the header and the drawer
    setOutsideInert(menuButtonRef.current?.closest('nav')?.parentElement, isOpen)
  }
  const handleMenuToggle = () => setMenuOpen(!isMenuOpen)
  const handleMenuClose = () => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <nav className="relative h-(--header-height) border-b border-default bg-background/90 backdrop-blur-xs dark:bg-background/95">
        <div className="section-container flex h-full items-center justify-between">
          <div className="flex h-full items-center">
            <div className="lg:w-[calc(var(--nav-inset)-0.625rem-1px)]">
              <Logo />
            </div>
            <Nav menus={menus} className="hidden lg:flex" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" asChild className="hidden h-7.5 lg:inline-flex">
              <a href={SIGN_UP_URL}>Start your project</a>
            </Button>
            <HeaderMenu className="hidden lg:inline-flex" />
            {isMenuOpen ? (
              <MobileNavThemeButton
                value={choice}
                onValueChange={onChoiceChange}
                className="lg:hidden"
              />
            ) : null}
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={handleMenuToggle}
              className={cn(
                buttonVariants({ variant: 'default' }),
                'relative size-7.5 min-w-7.5 border-default bg-surface-100/75 px-0',
                'text-foreground-light lg:hidden',
                "before:absolute before:-inset-y-2 before:left-0 before:-right-3 before:content-['']"
              )}
            >
              <span className="sr-only">{isMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              <Menu
                aria-hidden
                strokeWidth={1}
                className={cn(
                  'absolute inset-0 m-auto size-4.5 transition duration-150 ease-out',
                  isMenuOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
                )}
              />
              <X
                aria-hidden
                strokeWidth={1}
                className={cn(
                  'absolute inset-0 m-auto size-4.5 transition duration-150 ease-out',
                  !isMenuOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
                )}
              />
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu
        id={MOBILE_MENU_ID}
        open={isMenuOpen}
        menus={menus}
        currentPath={currentPath}
        onClose={handleMenuClose}
        className="lg:hidden"
      />
    </>
  )
}

const setOutsideInert = (element: Element | null | undefined, isInert: boolean) => {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling !== node) sibling.toggleAttribute('inert', isInert)
    }
  }
}
