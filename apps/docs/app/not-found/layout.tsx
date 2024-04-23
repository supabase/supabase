import { type PropsWithChildren } from 'react'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { MainSkeleton } from '~/layouts/MainSkeleton'

const NotFoundLayout = ({ children }: PropsWithChildren) => (
  <MainSkeleton menuId={MenuId.Home}>
    <LayoutMainContent>{children}</LayoutMainContent>
  </MainSkeleton>
)

export default NotFoundLayout
