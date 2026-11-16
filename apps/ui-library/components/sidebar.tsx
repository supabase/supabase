import { Menu } from 'lucide-react'
import { Button, ScrollArea, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from 'ui'

import { MobileMenuSheet } from './mobile-menu-sheet'
import { SideNavigation } from '@/components/side-navigation'

export function Sidebar() {
  return (
    <div className="md:hidden">
      <MobileMenuSheet>
        <SheetTrigger asChild>
          <Button
            variant="text"
            size="tiny"
            className="px-2"
            icon={<Menu size={18} />}
            aria-label="Open library navigation"
          />
        </SheetTrigger>
        <SheetContent side="left" className="w-80 max-w-[90vw] p-0">
          <SheetTitle className="sr-only">Library navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse guides and blocks by category.
          </SheetDescription>
          <ScrollArea className="h-full">
            <SideNavigation />
          </ScrollArea>
        </SheetContent>
      </MobileMenuSheet>
    </div>
  )
}
