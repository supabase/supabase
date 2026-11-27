import { useLocation } from '@tanstack/react-router'
import { AuthProvider } from 'common/auth'
import { DASHBOARD_PROJECTS_URL, DASHBOARD_SIGN_UP_URL } from 'common/constants/dashboard-urls'
import { useRef, useState } from 'react'
import { buttonVariants, cn } from 'ui'
import { MobileNavThemeButton } from 'ui-patterns/MobileNav/MobileNavThemeButton'
import { SignedInSwitch } from 'ui-patterns/SignedInSwitch/SignedInSwitch'
import {
  TopNavMenu,
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuItem,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'
import { TopNavMenuToggle } from 'ui-patterns/TopNav/TopNavMenuToggle'

import { HeaderMenu, useThemeChoice } from './HeaderMenu'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { getNavMenus } from '@/lib/nav'

// Mirrors apps/kb/src/components/Header.tsx

const MOBILE_MENU_ID = 'mobile-menu'

export const Header = () => {
  const menus = getNavMenus()
  const { pathname, searchStr } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { choice, onChoiceChange } = useThemeChoice()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen)

  return (
    <AuthProvider>
      <nav className="relative h-(--header-height) border-b border-default bg-background/90 backdrop-blur-xs dark:bg-background/95">
        <div className="section-container flex h-full items-center justify-between gap-3">
          <div className="flex h-full min-w-0 items-center">
            <div className="min-w-0 lg:w-[calc(var(--nav-inset)-0.625rem-1px)]">
              <Logo />
            </div>
            <TopNavMenu className="hidden lg:flex">
              {menus.map((menu) => (
                <TopNavMenuItem key={menu.label} label={menu.label}>
                  <TopNavMenuPanel>
                    {menu.groups.map((group) => (
                      <TopNavMenuGroup key={group.label} label={group.label}>
                        {group.links.map((link) => (
                          <TopNavMenuGroupLink key={link.href} href={link.href}>
                            {link.label}
                          </TopNavMenuGroupLink>
                        ))}
                      </TopNavMenuGroup>
                    ))}
                  </TopNavMenuPanel>
                </TopNavMenuItem>
              ))}
            </TopNavMenu>
          </div>
          <div className="flex items-center gap-2">
            {isMenuOpen && (
              <MobileNavThemeButton
                value={choice}
                onValueChange={onChoiceChange}
                className="lg:hidden"
              />
            )}
            <AccountLink className="hidden lg:inline-flex" />
            <HeaderMenu className="hidden lg:inline-flex" />
            <TopNavMenuToggle
              ref={menuButtonRef}
              isOpen={isMenuOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={handleMenuToggle}
              className="lg:hidden"
            />
          </div>
        </div>
      </nav>
      <MobileMenu
        id={MOBILE_MENU_ID}
        open={isMenuOpen}
        menus={menus}
        currentPath={`${pathname}${searchStr}`}
        toggleRef={menuButtonRef}
        className="lg:hidden"
      />
    </AuthProvider>
  )
}

const AccountLink = ({ className }: { className?: string }) => {
  const linkClassName = cn(buttonVariants({ variant: 'primary' }), 'h-7.5', className)

  return (
    <SignedInSwitch
      signedIn={
        <a href={DASHBOARD_PROJECTS_URL} className={linkClassName}>
          Dashboard
        </a>
      }
      signedOut={
        <a href={DASHBOARD_SIGN_UP_URL} className={linkClassName}>
          Sign up
        </a>
      }
    />
  )
}
