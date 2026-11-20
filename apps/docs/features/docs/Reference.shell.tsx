import type { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import {
  ReferenceNavigation,
  type ReferenceNavigationProps,
} from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { RightRailOnDesktop } from '~/layouts/RightRail'
import type { PropsWithChildren } from 'react'

interface ReferencePageShellProps extends PropsWithChildren {
  menuId: MenuId
  navigation: ReferenceNavigationProps
}

export const ReferencePageShell = ({ menuId, navigation, children }: ReferencePageShellProps) => (
  <ReferenceContentScrollHandler
    libPath={navigation.libPath}
    version={navigation.version}
    isLatestVersion={navigation.isLatestVersion}
  >
    <SidebarSkeleton
      menuId={menuId}
      hasRightRail
      NavigationMenu={
        // one copy serves the sidebar and the rail, so the page sends the navigation once
        <RightRailOnDesktop>
          <ReferenceNavigation {...navigation} />
        </RightRailOnDesktop>
      }
    >
      <LayoutMainContent className="layout-v2:pt-6">{children}</LayoutMainContent>
    </SidebarSkeleton>
  </ReferenceContentScrollHandler>
)
