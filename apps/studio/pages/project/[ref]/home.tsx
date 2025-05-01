import { useEffect, useRef, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Check, ChevronRight, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useParams } from 'common'
import { ReactFlowProvider } from 'reactflow'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
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
import type { NextPageWithLayout, Dashboards } from 'types'
import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  AiIconAnimation,
} from 'ui'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import {
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import type { AnalyticsInterval } from 'data/analytics/constants'
import { get } from 'data/fetchers'
import { ReportBlock } from 'components/interfaces/Reports/ReportBlock/ReportBlock'
import { useContentQuery } from 'data/content/content-query'
import ProjectLogsChart from 'components/interfaces/Home/ProjectLogsChart'
import AdvisorWidget from 'components/interfaces/Home/AdvisorWidget'
import InstanceDiagram from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceDiagram'
import { useBranchesQuery, Branch } from 'data/branches/branches-query'
import { partition } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import { GettingStarted } from 'components/interfaces/Home/GettingStarted'
import { ProjectUsageBars } from 'components/interfaces/Home/ProjectUsageBars'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { enableBranching } = useParams()

  // State to manage header opacity and scale based on scroll
  const [headerOpacity, setHeaderOpacity] = useState(1)
  const [headerScale, setHeaderScale] = useState(1)

  const hasShownEnableBranchingModalRef = useRef(false)
  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowEnableBranchingModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  // Effect to handle scroll and update opacity/scale
  // useEffect(() => {
  //   // Try to find the main scrollable element
  //   // Adjust the selector if your main scroll container is different
  //   const scrollContainer = document.querySelector('main') as HTMLElement | null

  //   const handleScroll = () => {
  //     let scrollPosition = 0
  //     if (scrollContainer) {
  //       scrollPosition = scrollContainer.scrollTop
  //     } else {
  //       // Fallback to window scroll if main isn't found
  //       scrollPosition = window.scrollY
  //     }
  //     // Fade out opacity over the first 200 pixels, min 0.15
  //     const newOpacity = Math.max(0.0, 1 - scrollPosition / 200)
  //     setHeaderOpacity(newOpacity)

  //     // Scale down over the first 200 pixels, min 0.98
  //     const scaleFactor = 0.02 // Amount to scale down (1 - 0.98)
  //     const newScale = Math.max(0.98, 1 - (scrollPosition / 200) * scaleFactor)
  //     setHeaderScale(newScale)
  //   }

  //   const targetElement = scrollContainer || window
  //   targetElement.addEventListener('scroll', handleScroll)

  //   // Initial call to set opacity based on initial scroll position
  //   handleScroll()

  //   // Cleanup function to remove the event listener
  //   return () => {
  //     targetElement.removeEventListener('scroll', handleScroll)
  //   }
  //   // Re-run effect if scrollContainer reference changes (though unlikely with querySelector)
  // }, [])

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  const { data: userContents, isLoading: isLoadingReports } = useContentQuery(
    {
      projectRef: project?.ref!,
      type: 'report',
    },
    { enabled: !!project?.ref }
  )

  const firstReport = useMemo(() => userContents?.content?.[0], [userContents])
  const reportContent = useMemo(
    () => firstReport?.content as Dashboards.Content | undefined,
    [firstReport]
  )

  const defaultReportDateHelper = useMemo(
    () =>
      getDefaultHelper(
        PREVIEWER_DATEPICKER_HELPERS.filter((helper) => helper.text === 'Last hour')
      ),
    []
  )
  const reportStartDate = useMemo(
    () => defaultReportDateHelper.calcFrom(),
    [defaultReportDateHelper]
  )
  const reportEndDate = useMemo(() => {
    // Ensure endDate always has a value, default to now if helper returns empty
    const calculatedEndDate = defaultReportDateHelper.calcTo()
    return calculatedEndDate || dayjs().toISOString()
  }, [defaultReportDateHelper])
  console.log('[Project Index] Calculated Dates:', { reportStartDate, reportEndDate })
  const reportInterval: AnalyticsInterval = '5m'

  const projectRef = project?.ref

  // [Charmer] Fetch branches if branching is enabled
  const {
    data: branches,
    error: branchesError,
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    isSuccess: isSuccessBranches,
  } = useBranchesQuery({ projectRef }, { enabled: !!projectRef && project?.is_branch_enabled })

  // [Charmer] Process branches to get the 5 most recent preview branches
  const recentBranches = useMemo(() => {
    if (!branches) return []
    const [[_mainBranch], previewBranchesUnsorted] = partition(
      branches,
      (branch) => branch.is_default
    )
    const previewBranches = previewBranchesUnsorted.sort((a, b) =>
      new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1
    )
    return previewBranches.slice(0, 5)
  }, [branches])

  return (
    <div className="mx-auto w-full mb-12 md:mb-16 max-w-full">
      {/* Apply dynamic opacity and scale to the sticky header with transition */}
      <div
        className="relative pt-12 bg-gradient-to-b from-background-surface-100/50 to-background-surface-57 top-0 transition-all duration-200 ease-out origin-top"
        style={{
          opacity: headerOpacity,
          transform: `scale(${headerScale})`,
          transformOrigin: 'top', // Ensure scaling originates from the top
        }}
      >
        {/* {project?.status !== PROJECT_STATUS.INACTIVE && project?.cloud_provider !== 'FLY' && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-surface-75" />

            <InstanceDiagram height={300} />
          </div>
        )} */}
        <div className="relative z-10 flex flex-row items-start justify-between gap-3 max-w-7xl mx-auto w-full mb-6">
          {/* Left side: Title and Badges */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="relative z-10">{projectName}</h1>
            <div className="flex items-center gap-x-3">
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
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full mb-6 relative z-10">
          <svg
            width="76"
            height="10"
            viewBox="0 0 76 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clip-path="url(#clip0_511_2229)">
              <path d="M-16 20L3.5 0.5" stroke="#343434" />
              <path d="M-12 20L7.5 0.5" stroke="#343434" />
              <path d="M-8 20L11.5 0.5" stroke="#343434" />
              <path d="M-4 20L15.5 0.5" stroke="#343434" />
              <path d="M0 20L19.5 0.5" stroke="#343434" />
              <path d="M4 20L23.5 0.5" stroke="#343434" />
              <path d="M8 20L27.5 0.5" stroke="#343434" />
              <path d="M12 20L31.5 0.5" stroke="#343434" />
              <path d="M16 20L35.5 0.5" stroke="#343434" />
              <path d="M20 20L39.5 0.5" stroke="#343434" />
              <path d="M24 20L43.5 0.5" stroke="#343434" />
              <path d="M28 20L47.5 0.5" stroke="#343434" />
              <path d="M32 20L51.5 0.5" stroke="#343434" />
              <path d="M36 20L55.5 0.5" stroke="#343434" />
              <path d="M40 20L59.5 0.5" stroke="#343434" />
              <path d="M44 20L63.5 0.5" stroke="#343434" />
              <path d="M48 20L67.5 0.5" stroke="#343434" />
              <path d="M52 20L71.5 0.5" stroke="#343434" />
              <path d="M56 20L75.5 0.5" stroke="#343434" />
              <path d="M60 20L79.5 0.5" stroke="#343434" />
              <path d="M64 20L83.5 0.5" stroke="#343434" />
              <path d="M68 20L87.5 0.5" stroke="#343434" />
              <path d="M72 20L91.5 0.5" stroke="#343434" />
              <path d="M76 20L95.5 0.5" stroke="#343434" />
            </g>
            <defs>
              <clipPath id="clip0_511_2229">
                <rect width="76" height="10" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <ProjectLogsChart
          projectRef={project?.ref!}
          startDate={reportStartDate}
          endDate={reportEndDate}
          interval={reportInterval}
        />
      </div>
      <div className="mx-6">
        <ProjectUpgradeFailedBanner />
      </div>
      {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState />}

      {project?.status !== PROJECT_STATUS.INACTIVE && (
        <>
          <div className="max-w-7xl mx-auto w-full mt-12 relative z-10 bg-surface-75">
            <GettingStarted projectRef={project?.ref!} />
            {/* [Charmer End] Getting Started guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {project?.ref && <AdvisorWidget projectRef={project.ref} />}

              {/* [Charmer] Add Recent Branches card */}
              {project?.is_branch_enabled && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-foreground-light">Recent Branches</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingBranches && (
                      <div className="space-y-2">
                        <ShimmeringLoader />
                        <ShimmeringLoader className="w-3/4" />
                        <ShimmeringLoader className="w-1/2" />
                      </div>
                    )}
                    {isErrorBranches && (
                      <AlertError
                        error={branchesError}
                        subject="Failed to retrieve recent branches"
                      />
                    )}
                    {isSuccessBranches && recentBranches.length === 0 && (
                      <div className="flex flex-col items-center justify-center space-y-2 w-full">
                        <div className="h-32 w-full relative">
                          <Image
                            fill
                            objectFit="cover"
                            src="/onboarding/branch.png"
                            alt="No branches"
                          />
                          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                        </div>
                        <div className="p-8 text-center">
                          <p className="text-sm text-foreground-light mb-4">
                            No branches found for this project yet.
                          </p>
                          <Button asChild type="default" size="tiny">
                            <Link href={`/project/${project?.ref}/branches`}>
                              Create your first branch
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                    {isSuccessBranches && recentBranches.length > 0 && (
                      <ul className="divide-y divide-border -mx-6 -mb-4">
                        {recentBranches.map((branch) => (
                          <li
                            key={branch.id}
                            className="px-6 py-3 flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <Link
                                href={`/project/${branch.project_ref}/branches`}
                                className="text-sm font-medium text-foreground hover:text-foreground-light transition"
                              >
                                {branch.name}
                              </Link>
                              <span className="text-xs text-foreground-lighter">
                                Updated {dayjs(branch.updated_at).fromNow()}
                              </span>
                            </div>
                            <Button asChild type="default" size="tiny">
                              <Link href={`/project/${branch.project_ref}/branches`}>
                                View Branch
                              </Link>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* [Charmer End] Add Recent Branches card */}
            </div>
            <div className="space-y-4">
              {isLoadingReports && (
                <div className="p-4 space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}

              {!isLoadingReports && !reportContent && (
                <div className="p-4 flex items-center space-x-4">
                  <FileText strokeWidth={1.5} size={20} />
                  <p className="text-sm text-foreground-light">
                    No custom reports found for this project. Create one in the Reports section.
                  </p>
                </div>
              )}

              {!isLoadingReports && reportContent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reportContent.layout
                    .sort((a, b) => {
                      if (a.y !== b.y) {
                        return a.y - b.y
                      }
                      return a.x - b.x
                    })
                    .map((item: Dashboards.Chart) => (
                      <ReportBlock
                        hideActions
                        key={item.id}
                        item={item}
                        startDate={reportStartDate}
                        endDate={reportEndDate}
                        interval={reportInterval}
                        disableUpdate={true}
                        isRefreshing={false}
                        onRemoveChart={() => {}}
                        onUpdateChart={() => {}}
                      />
                    ))}
                </div>
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
