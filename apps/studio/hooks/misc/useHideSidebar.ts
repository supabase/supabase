import { usePathname } from 'next/navigation'

export function useHideSidebar() {
  const pathname = usePathname() ?? ''
  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname === '/organizations' ||
    pathname === '/sign-in'
  console.log('pathname:', pathname, 'shouldHide:', shouldHide)
  return shouldHide
}
