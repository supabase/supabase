'use client'

import { usePathname } from 'next/navigation'
import { cn } from 'ui'

function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  console.log('usePathname', pathname)

  const scrollFlex = pathname.includes('/profile')

  return (
    <main
      role="main"
      className={cn(
        scrollFlex ? 'h-full w-full flex flex-col grow' : 'h-full w-full flex flex-col grow'
      )}
    >
      {children}
    </main>
  )
}

export { MainWrapper }
