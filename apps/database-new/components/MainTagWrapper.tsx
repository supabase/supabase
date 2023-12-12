'use client'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'

interface MainTagWrapperProps {
  children: React.ReactNode
}

const MainTagWrapper = ({ children }: MainTagWrapperProps) => {
  const pathname = usePathname()
  const isFullHeight = pathname.startsWith('/thread') || pathname === '/'

  return (
    <main role="main" className={cn('w-full flex flex-col grow', isFullHeight && 'h-full')}>
      {children}
    </main>
  )
}

export default MainTagWrapper
