'use client'
import SideNavigation from '@/components/side-navigation'
import { Button, cn, ScrollArea, Sheet, SheetContent, SheetTrigger } from 'ui'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'
import Link from 'next/link'

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background justify-between flex items-center px-8 py-3 border-b">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button type="outline" icon={<Menu />} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80" showClose={false}>
            <ScrollArea className="h-full">
              <SideNavigation setMobileMenuOpen={setMobileMenuOpen} hideLogo={true} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <ThemeSwitcherDropdown />
      </div>

      <aside className="fixed z-30 top-0 hidden h-screen w-full shrink-0 md:sticky md:block bg-200 border-r border-muted/50">
        <ScrollArea className="h-full">
          <SideNavigation setMobileMenuOpen={setMobileMenuOpen} />
        </ScrollArea>
      </aside>
    </>
  )
}
