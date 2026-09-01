import { usePathname } from 'next/navigation'

const ISOLATED_STUDIO_FLOW_PATH = /\/project\/[^/]+\/database\/replication\/new\/?$/

export const isIsolatedStudioFlow = (pathname: string) =>
  ISOLATED_STUDIO_FLOW_PATH.test((pathname.split('?')[0] ?? '').replace(/\/$/, '') || '/')

export function useIsolatedStudioFlow() {
  const pathname = usePathname() ?? ''
  return isIsolatedStudioFlow(pathname)
}

export function useHideSidebar() {
  const pathname = usePathname() ?? ''

  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname.startsWith('/support') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    isIsolatedStudioFlow(pathname)

  return shouldHide
}
