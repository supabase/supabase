import 'katex/dist/katex.min.css'
import { type PropsWithChildren } from 'react'

import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

const Layout = ({
  children,
  additionalNavItems,
}: PropsWithChildren<{ additionalNavItems?: Partial<NavMenuSection>[] }>) => {
  return (
    <SidebarSkeleton additionalNavItems={additionalNavItems}>
      <LayoutMainContent className="pb-0">{children}</LayoutMainContent>
    </SidebarSkeleton>
  )
}

export default Layout
