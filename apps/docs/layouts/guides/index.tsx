import 'katex/dist/katex.min.css'
import type { ReactNode, PropsWithChildren } from 'react'

import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

const Layout = ({
  children,
  additionalNavItems,
  NavigationMenu,
}: PropsWithChildren<{
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
  NavigationMenu?: ReactNode
}>) => {
  return (
    <SidebarSkeleton NavigationMenu={NavigationMenu} additionalNavItems={additionalNavItems}>
      <LayoutMainContent className="pb-0">{children}</LayoutMainContent>
    </SidebarSkeleton>
  )
}

export default Layout
