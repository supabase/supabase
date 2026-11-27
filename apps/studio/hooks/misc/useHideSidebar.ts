import { useLocation } from '@tanstack/react-router'

export function useHideSidebar() {
  const pathname = useLocation({ select: (location) => location.pathname })

  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname.startsWith('/support') ||
    pathname === '/organizations' ||
    pathname === '/sign-in'

  return shouldHide
}
