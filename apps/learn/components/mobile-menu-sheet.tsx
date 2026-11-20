'use client'

import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { Sheet } from 'ui'

interface MobileMenuSheetProps {
  children: React.ReactNode
}

export function MobileMenuSheet({ children }: MobileMenuSheetProps) {
  const { open, setOpen } = useMobileMenu()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
    </Sheet>
  )
}
