import { useParams } from 'common'
import { useCheckLatestDeploy } from '@/hooks/use-check-latest-deploy'
import { PropsWithChildren } from 'react'
import { SidebarProvider } from 'ui'

import { BannerStack } from '../ui/BannerStack/BannerStack'
import { BannerStackProvider } from '../ui/BannerStack/BannerStackProvider'
import { MobileSheetProvider } from './Navigation/NavigationBar/MobileSheetContext'
import { StudioMobileSheetNav } from './Navigation/NavigationBar/StudioMobileSheetNav'
import { LayoutSidebarProvider } from './ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'

export const DefaultLayoutProviders = ({ children }: PropsWithChildren) => {
  const { ref } = useParams()
  useCheckLatestDeploy()

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutSidebarProvider>
        <ProjectContextProvider projectRef={ref}>
          <MobileSheetProvider>
            <BannerStackProvider>
              {children}
              <BannerStack />
              <StudioMobileSheetNav />
            </BannerStackProvider>
          </MobileSheetProvider>
        </ProjectContextProvider>
      </LayoutSidebarProvider>
    </SidebarProvider>
  )
}
