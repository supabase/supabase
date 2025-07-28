import { usePathname } from 'next/navigation'

export function useHideSidebar() {
  const pathname = usePathname() ?? ''

  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname === '/support/new' ||
    pathname === '/organizations' ||
    pathname === '/sign-in'

  return shouldHide
}
