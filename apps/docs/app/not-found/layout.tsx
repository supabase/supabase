import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

const metadata: Metadata = {
  title: 'Not found',
  robots: {
    index: false,
  },
}

const NotFoundLayout = ({ children }: PropsWithChildren) => (
  <SidebarSkeleton>
    <LayoutMainContent>{children}</LayoutMainContent>
  </SidebarSkeleton>
)

export default NotFoundLayout
export { metadata }
