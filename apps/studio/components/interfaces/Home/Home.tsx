import dayjs from 'dayjs'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { AdvisorWidget } from 'components/interfaces/Home/AdvisorWidget'
import { ClientLibrary } from 'components/interfaces/Home/ClientLibrary'
import { ExampleProject } from 'components/interfaces/Home/ExampleProject'
import { EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { NewProjectPanel } from 'components/interfaces/Home/NewProjectPanel/NewProjectPanel'
import { ProjectUsageSection } from 'components/interfaces/Home/ProjectUsageSection'
import { ServiceStatus } from 'components/interfaces/Home/ServiceStatus'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
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
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const Home = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: parentProject } = useProjectDetailQuery({ ref: project?.parent_project_ref })
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { ref, enableBranching } = useParams()

  const { projectHomepageExampleProjects, projectHomepageClientLibraries: clientLibraries } =
    useCustomContent(['project_homepage:example_projects', 'project_homepage:client_libraries'])

  const {
    projectHomepageShowInstanceSize: showInstanceSize,
    projectHomepageShowExamples: showExamples,
  } = useIsFeatureEnabled(['project_homepage:show_instance_size', 'project_homepage:show_examples'])

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

  const { data: tablesData, isPending: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })
  const { data: functionsData, isPending: isLoadingFunctions } = useEdgeFunctionsQuery({
    projectRef: project?.ref,
  })
  const { data: replicasData, isPending: isLoadingReplicas } = useReadReplicasQuery({
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

  if (isPaused) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProjectPausedState />
      </div>
    )
  }

  return (
    <div className="w-full px-4">
      <div className={cn('py-16 ', !isPaused && 'border-b border-muted ')}>
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
                      <InlineLink href={`${DOCS_URL}/guides/database/orioledb`}>
                        documentation
                      </InlineLink>{' '}
                      for all limitations.
                    </TooltipContent>
                  </Tooltip>
                )}
                {showInstanceSize && (
                  <ComputeBadgeWrapper
                    projectRef={project?.ref}
                    slug={organization?.slug}
                    cloudProvider={project?.cloud_provider}
                    computeSize={project?.infra_compute_size}
                  />
                )}
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

                    {isLoadingTables ? (
                      <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                    ) : (
                      <p className="text-2xl tabular-nums">{tablesCount}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/project/${ref}/functions`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Functions
                    </Link>
                    {isLoadingFunctions ? (
                      <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                    ) : (
                      <p className="text-2xl tabular-nums">{functionsCount}</p>
                    )}
                  </div>

                  {IS_PLATFORM && (
                    <div className="flex flex-col gap-y-1">
                      <Link
                        href={`/project/${ref}/settings/infrastructure`}
                        className="transition text-foreground-light hover:text-foreground text-sm"
                      >
                        Replicas
                      </Link>
                      {isLoadingReplicas ? (
                        <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                      ) : (
                        <p className="text-2xl tabular-nums">{replicasCount}</p>
                      )}
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
        </div>
      </div>

      <>
        <div className="py-16 border-b border-muted">
          <div className="mx-auto max-w-7xl space-y-16 @container">
            {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && (
              <>{isNewProject ? <NewProjectPanel /> : <ProjectUsageSection />}</>
            )}
            {!isNewProject && project?.status !== PROJECT_STATUS.INACTIVE && <AdvisorWidget />}
          </div>
        </div>

        <div className="bg-surface-100/5 py-16">
          <div className="mx-auto max-w-7xl space-y-16 @container">
            {project?.status !== PROJECT_STATUS.INACTIVE && (
              <>
                <div className="space-y-8">
                  <h2 className="text-lg">Client libraries</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:gap-12 mb-12 md:grid-cols-3">
                    {clientLibraries!.map((library) => (
                      // [Alaister]: Looks like the useCustomContent has wonky types. I'll look at a fix later.
                      <ClientLibrary key={(library as any).language} {...(library as any)} />
                    ))}
                  </div>
                </div>
                {showExamples && (
                  <div className="flex flex-col gap-y-8">
                    <h4 className="text-lg">Example projects</h4>
                    {!!projectHomepageExampleProjects ? (
                      <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {/* [Alaister]: Looks like the useCustomContent has wonky types. I'll look at a fix later. */}
                        {(projectHomepageExampleProjects as any)
                          .sort((a: any, b: any) => a.title.localeCompare(b.title))
                          .map((project: any) => (
                            <ExampleProject key={project.url} {...project} />
                          ))}
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    </div>
  )
}
