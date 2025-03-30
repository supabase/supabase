'use client'

import { Menu } from 'lucide-react'
import SideNavigation from '@/components/side-navigation'
import { Button, ScrollArea, Sheet, SheetContent, SheetTrigger } from 'ui'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'
import { useMobileMenu } from '@/hooks/use-mobile-menu'

export default function Sidebar() {
  const { isOpen, close } = useMobileMenu()

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background justify-between flex items-center px-8 py-3 border-b">
        <Sheet open={isOpen} onOpenChange={close}>
          <SheetTrigger asChild>
            <Button type="outline" icon={<Menu />} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80" showClose={false}>
            <ScrollArea className="h-full">
              <SideNavigation setMobileMenuOpen={close} hideLogo={true} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <ThemeSwitcherDropdown />
      </div>

      <aside className="fixed z-30 top-0 hidden h-screen w-full shrink-0 md:sticky md:block bg-200 border-r border-muted/50">
        <ScrollArea className="h-full">
          <SideNavigation setMobileMenuOpen={close} />
        </ScrollArea>
      </aside>
    </>
  )
}
