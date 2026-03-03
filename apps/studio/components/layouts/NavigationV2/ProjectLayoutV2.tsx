import { mergeRefs, useParams } from 'common'
import { CreateBranchModal } from 'components/interfaces/BranchManagement/CreateBranchModal'
import { ProjectAPIDocs } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs'
import { ResourceExhaustionWarningBanner } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { usePHFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { forwardRef, Fragment, PropsWithChildren, useEffect } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { LogoLoader } from 'ui'

import { useSetMainScrollContainer } from '../MainScrollContainerContext'
import BuildingState from '../ProjectLayout/BuildingState'
import ConnectingState from '../ProjectLayout/ConnectingState'
import { LoadingState } from '../ProjectLayout/LoadingState'
import { ProjectPausedState } from '../ProjectLayout/PausedState/ProjectPausedState'
import { PauseFailedState } from '../ProjectLayout/PauseFailedState'
import { PausingState } from '../ProjectLayout/PausingState'
import { ResizingState } from '../ProjectLayout/ResizingState'
import RestartingState from '../ProjectLayout/RestartingState'
import { RestoreFailedState } from '../ProjectLayout/RestoreFailedState'
import RestoringState from '../ProjectLayout/RestoringState'
import { UpgradingState } from '../ProjectLayout/UpgradingState'

const routesToIgnoreProjectDetailsRequest = [
  '/project/[ref]/settings/general',
  '/project/[ref]/database/settings',
  '/project/[ref]/storage/settings',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

const routesToIgnoreDBConnection = [
  '/project/[ref]/branches',
  '/project/[ref]/database/backups/scheduled',
  '/project/[ref]/database/backups/pitr',
  '/project/[ref]/settings/addons',
  '/project/[ref]/functions',
]

const routesToIgnorePostgrestConnection = [
  '/project/[ref]/reports',
  '/project/[ref]/settings/general',
  '/project/[ref]/database/settings',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

export interface ProjectLayoutV2Props {
  title?: string
  isLoading?: boolean
  isBlocking?: boolean
  product?: string
  selectedTable?: string
}

/**
 * V2 Project layout - renders content directly without a secondary product menu sidebar.
 * In V2, all navigation is in the primary sidebar (AppSidebarV2), so this layout
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

interface ContentWrapperProps {
  isLoading: boolean
  isBlocking?: boolean
  children: React.ReactNode
}

const ContentWrapper = ({ isLoading, isBlocking = true, children }: ContentWrapperProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isHomeNew = usePHFlag('homeNew') === 'new-home'

  const isBranchesPage = router.pathname.includes('/project/[ref]/branches')
  const isSettingsPages = router.pathname.includes('/project/[ref]/settings')
  const isEdgeFunctionPages = router.pathname.includes('/project/[ref]/functions')
  const isVaultPage = router.pathname === '/project/[ref]/settings/vault'
  const isBackupsPage = router.pathname.includes('/project/[ref]/database/backups')
  const isHomePage = router.pathname === '/project/[ref]'

  const requiresDbConnection: boolean =
    (!isEdgeFunctionPages &&
      !isSettingsPages &&
      !routesToIgnoreDBConnection.includes(router.pathname)) ||
    isVaultPage
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const isRestarting = selectedProject?.status === PROJECT_STATUS.RESTARTING
  const isResizing = selectedProject?.status === PROJECT_STATUS.RESIZING
  const isProjectUpgrading = selectedProject?.status === PROJECT_STATUS.UPGRADING
  const isProjectRestoring = selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectRestoreFailed = selectedProject?.status === PROJECT_STATUS.RESTORE_FAILED
  const isProjectBuilding =
    selectedProject?.status === PROJECT_STATUS.COMING_UP ||
    selectedProject?.status === PROJECT_STATUS.UNKNOWN
  const isProjectPausing = selectedProject?.status === PROJECT_STATUS.PAUSING
  const isProjectPauseFailed = selectedProject?.status === PROJECT_STATUS.PAUSE_FAILED
  const isProjectOffline = selectedProject?.postgrestStatus === 'OFFLINE'

  const shouldRedirectToHomeForBuilding =
    isHomeNew && requiresDbConnection && isProjectBuilding && !isBranchesPage && !isHomePage

  const shouldShowBuildingState =
    requiresDbConnection && isProjectBuilding && !isBranchesPage && !(isHomeNew && isHomePage)

  useEffect(() => {
    if (shouldRedirectToHomeForBuilding && ref) {
      router.replace(`/project/${ref}`)
    }
  }, [shouldRedirectToHomeForBuilding, ref, router])

  useEffect(() => {
    if (ref) state.setSelectedDatabaseId(ref)
  }, [ref])

  if (isBlocking && (isLoading || (requiresProjectDetails && selectedProject === undefined))) {
    return router.pathname.endsWith('[ref]') ? <LoadingState /> : <LogoLoader />
  }

  if (isRestarting && !isBackupsPage) {
    return <RestartingState />
  }

  if (isResizing && !isBackupsPage) {
    return <ResizingState />
  }

  if (isProjectUpgrading && !isBackupsPage) {
    return <UpgradingState />
  }

  if (isProjectPausing) {
    return <PausingState project={selectedProject} />
  }

  if (isProjectPauseFailed) {
    return <PauseFailedState />
  }

  if (requiresPostgrestConnection && isProjectOffline) {
    return <ConnectingState project={selectedProject} />
  }

  if (requiresDbConnection && isProjectRestoring) {
    return <RestoringState />
  }

  if (isProjectRestoreFailed && !isBackupsPage && !isEdgeFunctionPages) {
    return <RestoreFailedState />
  }

  if (shouldRedirectToHomeForBuilding) {
    return <LogoLoader />
  }

  if (shouldShowBuildingState) {
    return <BuildingState />
  }

  return <Fragment key={selectedProject?.ref}>{children}</Fragment>
}
