import 'katex/dist/katex.min.css'

import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import type { PropsWithChildren, ReactNode } from 'react'

const Layout = ({
  children,
  additionalNavItems,
  NavigationMenu,
}: PropsWithChildren<{
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
  NavigationMenu?: ReactNode
}>) => {
  return (
    <SidebarSkeleton
      NavigationMenu={NavigationMenu}
      additionalNavItems={additionalNavItems}
      hasRightRail
    >
      <LayoutMainContent className="pb-0 lg:px-20">{children}</LayoutMainContent>
    </SidebarSkeleton>
  )
}

export default Layout
