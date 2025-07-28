import dayjs from 'dayjs'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject, NewProjectPanel } from 'components/interfaces/Home'
import { AdvisorWidget } from 'components/interfaces/Home/AdvisorWidget'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { ProjectUsageSection } from 'components/interfaces/Home/ProjectUsageSection'
import { ServiceStatus } from 'components/interfaces/Home/ServiceStatus'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb, useProjectByRef, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  cn,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useBranchesQuery } from 'data/branches/branches-query'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()
  const parentProject = useProjectByRef(project?.parent_project_ref)
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { ref, enableBranching } = useParams()

  const hasShownEnableBranchingModalRef = useRef(false)
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const isNewProject = dayjs(project?.inserted_at).isAfter(dayjs().subtract(2, 'day'))

  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowCreateBranchModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  const { data: tablesData, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })
  const { data: functionsData, isLoading: isLoadingFunctions } = useEdgeFunctionsQuery({
    projectRef: project?.ref,
  })
  const { data: replicasData, isLoading: isLoadingReplicas } = useReadReplicasQuery({
    projectRef: project?.ref,
  })

  const { data: branches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })

  const mainBranch = branches?.find((branch) => branch.is_default)
  const currentBranch = branches?.find((branch) => branch.project_ref === project?.ref)
  const isMainBranch = currentBranch?.name === mainBranch?.name
  let projectName = 'Welcome to your project'

  if (currentBranch && !isMainBranch) {
    projectName = currentBranch?.name
  } else if (project?.name) {
    projectName = project?.name
  }

  const tablesCount = Math.max(0, tablesData?.length ?? 0)
  const functionsCount = Math.max(0, functionsData?.length ?? 0)
  // [Joshen] JFYI minus 1 as the replicas endpoint returns the primary DB minimally
  const replicasCount = Math.max(0, (replicasData?.length ?? 1) - 1)

  return (
    <div className="w-full">
      <div className={cn('py-16 px-8', !isPaused && 'border-b border-muted ')}>
        <div className="mx-auto max-w-7xl flex flex-col gap-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between w-full">
            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full">
              <div>
                {!isMainBranch && (
                  <Link
                    href={`/project/${parentProject?.ref}`}
                    className="text-sm text-foreground-light"
                  >
                    {parentProject?.name}
                  </Link>
                )}
                <h1 className="text-3xl">{projectName}</h1>
              </div>
              <div className="flex items-center gap-x-2 mb-1">
                {isOrioleDb && (
                  <Tooltip>
                    <TooltipTrigger asChild>
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
            </div>
            <div className="flex items-center">
              {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="flex items-center gap-x-6">
                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/project/${ref}/editor`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Tables
                    </Link>
                    <p className="text-2xl tabular-nums">
                      {isLoadingTables ? (
                        <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                      ) : (
                        tablesCount
                      )}
                    </p>
                  </div>

                  {IS_PLATFORM && (
                    <div className="flex flex-col gap-y-1">
                      <Link
                        href={`/project/${ref}/functions`}
                        className="transition text-foreground-light hover:text-foreground text-sm"
                      >
                        Functions
                      </Link>
                      <p className="text-2xl tabular-nums">
                        {isLoadingFunctions ? (
                          <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                        ) : (
                          functionsCount
                        )}
                      </p>
                    </div>
                  )}

                  {IS_PLATFORM && (
                    <div className="flex flex-col gap-y-1">
                      <Link
                        href={`/project/${ref}/settings/infrastructure`}
                        className="transition text-foreground-light hover:text-foreground text-sm"
                      >
                        Replicas
                      </Link>
                      <p className="text-2xl tabular-nums">
                        {isLoadingReplicas ? (
                          <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                        ) : (
                          replicasCount
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="ml-6 border-l flex items-center w-[145px] justify-end">
                  <ServiceStatus />
                </div>
              )}
            </div>
          </div>
          <ProjectUpgradeFailedBanner />
          {isPaused && <ProjectPausedState />}
        </div>
      </div>

      {!isPaused && (
        <>
          <div className="py-16 border-b border-muted px-8">
            <div className="mx-auto max-w-7xl space-y-16">
              {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && (
                <>{isNewProject ? <NewProjectPanel /> : <ProjectUsageSection />}</>
              )}
              {!isNewProject && project?.status !== PROJECT_STATUS.INACTIVE && <AdvisorWidget />}
            </div>
          </div>

          <div className="bg-surface-100/5 py-16">
            <div className="mx-auto max-w-7xl space-y-16">
              {project?.status !== PROJECT_STATUS.INACTIVE && (
                <>
                  <div className="space-y-8">
                    <h2 className="text-lg">Client libraries</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:gap-12 mb-12 md:grid-cols-3">
                      {CLIENT_LIBRARIES.map((library) => (
                        <ClientLibrary key={library.language} {...library} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h4 className="text-lg">Example projects</h4>
                    <div className="flex justify-center">
                      <Tabs_Shadcn_ defaultValue="app" className="w-full">
                        <TabsList_Shadcn_ className="flex gap-4 mb-8">
                          <TabsTrigger_Shadcn_ value="app">App Frameworks</TabsTrigger_Shadcn_>
                          <TabsTrigger_Shadcn_ value="mobile">
                            Mobile Frameworks
                          </TabsTrigger_Shadcn_>
                        </TabsList_Shadcn_>
                        <TabsContent_Shadcn_ value="app">
                          <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {EXAMPLE_PROJECTS.filter((project) => project.type === 'app')
                              .sort((a, b) => a.title.localeCompare(b.title))
                              .map((project) => (
                                <ExampleProject key={project.url} {...project} />
                              ))}
                          </div>
                        </TabsContent_Shadcn_>
                        <TabsContent_Shadcn_ value="mobile">
                          <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {EXAMPLE_PROJECTS.filter((project) => project.type === 'mobile')
                              .sort((a, b) => a.title.localeCompare(b.title))
                              .map((project) => (
                                <ExampleProject key={project.url} {...project} />
                              ))}
                          </div>
                        </TabsContent_Shadcn_>
                      </Tabs_Shadcn_>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
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
