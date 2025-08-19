import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { Sidebar } from 'components/interfaces/Sidebar'
import { useCheckLatestDeploy } from 'hooks/use-check-latest-deploy'
import { SidebarProvider } from 'ui'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'
import {
  deleteOrganizationCookie,
  deleteProjectCookie,
  setOrganizationCookie,
  setProjectCookie,
} from '../../data/vela/vela'
import { useOrganizationQuery } from '../../data/organizations/organization-query'
import { useSelectedProjectQuery } from '../../hooks/misc/useSelectedProject'
import { useProjectDetailQuery } from '../../data/projects/project-detail-query'
import { useProjectsQuery } from '../../data/projects/projects-query'
import { OrganizationContextProvider } from './OrganizationContext'
import { getOrganizationSlug } from '../../data/vela/organization-path-slug'
import { getProjectRef } from '../../data/vela/project-path-ref'

export interface DefaultLayoutProps {
  headerTitle?: string
}

/**
 * Base layout for all project pages in the dashboard, rendered as the first child on all page files within a project.
 *
 * A second layout as the child to this is required, and the layout depends on which section of the dashboard the page is on. (e.g Auth - AuthLayout)
 *
 * The base layout handles rendering the following UI components:
 * - App banner (e.g for notices or incidents)
 * - Mobile navigation bar
 * - First level side navigation bar (e.g For navigating to Table Editor, SQL Editor, Database page, etc)
 */
const DefaultLayout = ({ children, headerTitle }: PropsWithChildren<DefaultLayoutProps>) => {
  const [ isInitialized, setInitialized ] = useState<boolean>(false);

  useEffect(() => {
    setInitialized(true);
  }, [])

  const slug = getOrganizationSlug()
  const ref = getProjectRef()
  const router = useRouter()
  const showProductMenu = !!ref && router.pathname !== '/org/[slug]/project/[ref]'

  useCheckLatestDeploy()

  if (!isInitialized) {
    return (
      <div>BAM FUCKER</div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <OrganizationContextProvider organizationSlug={slug}>
        <ProjectContextProvider projectRef={ref}>
          <AppBannerContextProvider>
            <div className="flex flex-col h-screen w-screen">
              {/* Top Banner */}
              <AppBannerWrapper />
              <div className="flex-shrink-0">
                <MobileNavigationBar />
                <LayoutHeader showProductMenu={showProductMenu} headerTitle={headerTitle} />
              </div>
              {/* Main Content Area */}
              <div className="flex flex-1 w-full overflow-y-hidden">
                {/* Sidebar */}
                <Sidebar />
                {/* Main Content */}
                <div className="flex-grow h-full overflow-y-auto">{children}</div>
              </div>
            </div>
          </AppBannerContextProvider>
        </ProjectContextProvider>
      </OrganizationContextProvider>
    </SidebarProvider>
  )
}

export default DefaultLayout
