import { usePathname } from 'next/navigation'

export function useHideSidebar() {
  const pathname = usePathname() ?? ''
  return (
    pathname.startsWith('/account') || pathname.startsWith('/new') || pathname === '/organizations'
  )
}
