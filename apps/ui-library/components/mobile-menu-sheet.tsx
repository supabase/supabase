'use client'

import { Sheet } from 'ui'

import { useMobileMenu } from '@/hooks/use-mobile-menu'

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
