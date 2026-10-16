import { Menu } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from 'ui'

import { SIGN_UP_URL } from '../lib/nav'
import { HeaderMenu } from './HeaderMenu'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { Nav } from './Nav'

const MOBILE_MENU_ID = 'mobile-menu'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const setMenuOpen = (isOpen: boolean) => {
    setIsMenuOpen(isOpen)
    document.documentElement.toggleAttribute('data-mobile-menu-open', isOpen)
  }
  const handleMenuOpen = () => setMenuOpen(true)
  const handleMenuClose = () => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <nav className="relative h-(--header-height) border-b border-default bg-background/90 backdrop-blur-xs dark:bg-background/95 in-data-[hero-kind=warp]:border-b-transparent">
        <div className="section-container flex h-full items-center justify-between">
          <div className="flex h-full items-center">
            <div className="lg:w-[calc(var(--nav-inset)-0.625rem-1px)]">
              <Logo />
            </div>
            <Nav className="hidden lg:flex" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" asChild className="hidden lg:inline-flex">
              <a href={SIGN_UP_URL}>Start your project</a>
            </Button>
            <HeaderMenu className="hidden lg:inline-flex" />
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={handleMenuOpen}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground-lighter hover:bg-overlay hover:text-foreground-light focus-ring lg:hidden"
            >
              <span className="sr-only">Open main menu</span>
              <Menu aria-hidden className="size-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>
      {isMenuOpen ? (
        <MobileMenu id={MOBILE_MENU_ID} onClose={handleMenuClose} className="lg:hidden" />
      ) : null}
    </>
  )
}
