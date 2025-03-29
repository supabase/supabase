'use client'
import SideNavigation from '@/components/side-navigation'
import { cn, ScrollArea } from 'ui'
import { useState } from 'react'

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <>
      <button
        className="lg:hidden h-4 grid z-50"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter" />
        <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter" />
      </button>

      <aside
        className={cn(
          'fixed z-30 top-0 hidden h-screen w-full shrink-0 md:sticky md:block bg-200 border-r border-muted/50',
          mobileMenuOpen && 'block'
        )}
      >
        <ScrollArea className="h-full">
          <SideNavigation />
        </ScrollArea>
      </aside>
    </>
  )
}
