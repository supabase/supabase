import { usePathname } from 'next/navigation'

import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'

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
