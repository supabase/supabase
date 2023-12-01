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
    <main
      role="main"
      className={cn('w-full flex flex-col grow', isFullHeight && 'h-[calc(100vh-115px)]')}
    >
      {children}
    </main>
  )
}

export default MainTagWrapper
