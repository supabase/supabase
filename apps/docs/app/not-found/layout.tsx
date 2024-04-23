import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { MainSkeleton } from '~/layouts/MainSkeleton'

const metadata: Metadata = {
  title: 'Not found',
  robots: {
    index: false,
  },
}

const NotFoundLayout = ({ children }: PropsWithChildren) => (
  <MainSkeleton menuId={MenuId.Home}>
    <LayoutMainContent>{children}</LayoutMainContent>
  </MainSkeleton>
)

export default NotFoundLayout
export { metadata }
