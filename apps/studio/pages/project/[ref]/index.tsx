import { useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import { SecurityStatus } from 'components/interfaces/Home/SecurityStatus'
import ServiceStatus from 'components/interfaces/Home/ServiceStatus'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import AdvisorWidget from 'components/interfaces/Home/AdvisorWidget'
import { GettingStarted } from 'components/interfaces/Home/GettingStarted'
import { useTablesQuery } from 'data/tables/tables-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { Database, Zap, GitFork } from 'lucide-react'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { enableBranching } = useParams()
  const [showGettingStarted, setShowGettingStarted] = useState(true)

  const hasShownEnableBranchingModalRef = useRef(false)
  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowEnableBranchingModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  const { data: tablesData, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: functionsData, isLoading: isLoadingFunctions } = useEdgeFunctionsQuery({
    projectRef: project?.ref,
  })
  const { data: replicasData, isLoading: isLoadingReplicas } = useReadReplicasQuery({
    projectRef: project?.ref,
  })

  const tablesCount = tablesData?.length ?? 0
  const functionsCount = functionsData?.length ?? 0
  const replicasCount = replicasData?.length ?? 0

  return (
    <div className="w-full space-y-12 md:space-y-16">
      <div className="bg-surface-100/75 border-b border-muted py-16">
        <div className="mx-auto max-w-7xl">
          <div className=" flex items-center justify-between w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
              <h1 className="text-3xl">{projectName}</h1>
              {isOrioleDb && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="warning">OrioleDB</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-80 text-center">
                    This project is using Postgres with OrioleDB which is currently in preview and
                    not suitable for production workloads. View our{' '}
                    <InlineLink href="https://supabase.com/docs/guides/database/orioledb">
                      documentation
                    </InlineLink>{' '}
                    for all limitations.
                  </TooltipContent>
                </Tooltip>
              )}
              <ComputeBadgeWrapper
                project={{
                  ref: project?.ref,
                  organization_slug: organization?.slug,
                  cloud_provider: project?.cloud_provider,
                  infra_compute_size: project?.infra_compute_size,
                }}
              />
            </div>
            <div className="flex items-center">
              {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="flex items-center gap-x-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-foreground-light text-sm mb-1">
                      <Database size={14} strokeWidth={1.5} />
                      Table{tablesCount !== 1 ? 's' : ''}
                    </div>
                    <span className="text-2xl font-mono tabular-nums">
                      {isLoadingTables ? '...' : tablesCount}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-foreground-light text-sm mb-1">
                      <Zap size={14} strokeWidth={1.5} />
                      Function{functionsCount !== 1 ? 's' : ''}
                    </div>
                    <span className="text-2xl font-mono tabular-nums">
                      {isLoadingFunctions ? '...' : functionsCount}
                    </span>
                  </div>

                  {IS_PLATFORM && (
                    <div>
                      <div className="flex items-center gap-1.5 text-foreground-light text-sm mb-1">
                        <GitFork size={14} strokeWidth={1.5} />
                        Replica{replicasCount !== 1 ? 's' : ''}
                      </div>
                      <span className="text-2xl font-mono tabular-nums">
                        {isLoadingReplicas ? '...' : replicasCount}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="ml-6 pl-6 border-l">
                  <ServiceStatus />
                </div>
              )}
            </div>
          </div>
          <ProjectUpgradeFailedBanner />
          {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState />}

          {project?.ref && project?.status !== PROJECT_STATUS.INACTIVE && showGettingStarted && (
            <div className="mt-16 -mb-48">
              <GettingStarted
                projectRef={project.ref}
                onRemove={() => setShowGettingStarted(false)}
              />
            </div>
          )}
        </div>
      </div>
      {showGettingStarted && <div className="h-16" />}

      <div className="mx-auto max-w-7xl">
        {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && <ProjectUsageSection />}
      </div>

      {project?.status !== PROJECT_STATUS.INACTIVE && (
        <>
          {project?.ref && (
            <div className="mx-auto max-w-7xl pb-32">
              <AdvisorWidget projectRef={project.ref} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default Home
