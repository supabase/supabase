import { mergeRefs } from 'common'
import { CreateBranchModal } from 'components/interfaces/BranchManagement/CreateBranchModal'
import { ProjectAPIDocs } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs'
import { ResourceExhaustionWarningBanner } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { PROJECT_STATUS } from 'lib/constants'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { forwardRef, type PropsWithChildren } from 'react'

import { useSetMainScrollContainer } from '../MainScrollContainerContext'
import { ContentWrapper } from '../ProjectLayout'
import { ProjectPausedState } from '../ProjectLayout/PausedState/ProjectPausedState'

export interface ProjectLayoutV2Props {
  title?: string
  isLoading?: boolean
  isBlocking?: boolean
  product?: string
  selectedTable?: string
}

/**
 * V2 Project layout - renders content directly without a secondary product menu sidebar.
 * In V2, all navigation is in the primary sidebar (AppSidebar), so this layout
 * only handles title, loading states, and content wrapping.
 */
export const ProjectLayoutV2 = forwardRef<HTMLDivElement, PropsWithChildren<ProjectLayoutV2Props>>(
  ({ title, isLoading = false, isBlocking = true, product = '', children, selectedTable }, ref) => {
    const router = useRouter()
    const { data: selectedOrganization } = useSelectedOrganizationQuery()
    const { data: selectedProject } = useSelectedProjectQuery()

    const setMainScrollContainer = useSetMainScrollContainer()
    const combinedRef = mergeRefs(ref, setMainScrollContainer)

    const { appTitle } = useCustomContent(['app:title'])
    const titleSuffix = appTitle || 'Supabase'

    const projectName = selectedProject?.name
    const organizationName = selectedOrganization?.name

    const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE

    const ignorePausedState =
      router.pathname === '/project/[ref]' ||
      router.pathname.includes('/project/[ref]/settings') ||
      router.pathname.includes('/project/[ref]/functions')
    const showPausedState = isPaused && !ignorePausedState

    return (
      <>
        <Head>
          <title>
            {title
              ? `${title} | ${titleSuffix}`
              : selectedTable
                ? `${selectedTable} | ${projectName} | ${organizationName} | ${titleSuffix}`
                : projectName
                  ? `${projectName} | ${organizationName} | ${titleSuffix}`
                  : organizationName
                    ? `${organizationName} | ${titleSuffix}`
                    : titleSuffix}
          </title>
          <meta name="description" content="Supabase Studio" />
        </Head>
        <main
          className="@container flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto"
          ref={combinedRef}
        >
          {showPausedState ? (
            <div className="mx-auto my-16 w-full h-full max-w-7xl flex items-center">
              <div className="w-full">
                <ProjectPausedState product={product} />
              </div>
            </div>
          ) : (
            <ContentWrapper isLoading={isLoading} isBlocking={isBlocking}>
              <ResourceExhaustionWarningBanner />
              {children}
            </ContentWrapper>
          )}
        </main>
        <CreateBranchModal />
        <ProjectAPIDocs />
      </>
    )
  }
)

ProjectLayoutV2.displayName = 'ProjectLayoutV2'

export const ProjectLayoutV2WithAuth = withAuth(ProjectLayoutV2)
