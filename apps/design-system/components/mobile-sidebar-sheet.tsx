'use client'

import { ScrollArea, Sheet, SheetContent, SheetTitle } from 'ui'

import { SideNavigation } from '@/components/side-navigation'
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar'

export function MobileSidebarSheet() {
  const { open, setOpen } = useMobileSidebar()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-[240px] sm:w-[280px]" showClose={false}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <ScrollArea className="h-full py-6 lg:py-8">
          <SideNavigation />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
