import { usePathname } from 'next/navigation'

import { useIsNewLayoutEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export function useHideSidebar() {
  const newLayoutPreview = useIsNewLayoutEnabled()
  const pathname = usePathname() ?? ''

  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname === '/support/new' ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    (pathname === '/projects' && newLayoutPreview)

  return shouldHide
}
