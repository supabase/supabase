import { useNewLayout } from 'hooks/ui/useNewLayout'
import { usePathname } from 'next/navigation'

export function useHideSidebar() {
  const newLayoutPreview = useNewLayout()
  const pathname = usePathname() ?? ''
  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    (pathname === '/projects' && newLayoutPreview)

  return shouldHide
}
