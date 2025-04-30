import { useEffect, useRef, useMemo } from 'react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { ReactFlowProvider } from 'reactflow'
import { BarChart2, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

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
import type { NextPageWithLayout, Dashboards } from 'types'
import {
  Badge,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  Card,
} from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import InstanceConfiguration from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import {
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import { genChartQuery } from 'components/interfaces/Settings/Logs/Logs.utils'
import type { EventChart, Count } from 'components/interfaces/Settings/Logs/Logs.types'
import type { AnalyticsInterval } from 'data/analytics/constants'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import useTimeseriesUnixToIso from 'hooks/analytics/useTimeseriesUnixToIso'
import { get } from 'data/fetchers'
import { ReportBlock } from 'components/interfaces/Reports/ReportBlock/ReportBlock'
import { useContentQuery } from 'data/content/content-query'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { enableBranching } = useParams()

  const hasShownEnableBranchingModalRef = useRef(false)
  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowEnableBranchingModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  // [Logs] Set time range for the last hour
  const logsTimestampTo = useMemo(() => new Date().toISOString(), [])
  const logsTimestampFrom = useMemo(() => dayjs().subtract(1, 'hour').toISOString(), [])

  // [Logs] Generate chart query
  const chartQuery = useMemo(
    () =>
      genChartQuery(
        LogsTableName.POSTGRES,
        {
          project: project?.ref as string,
          iso_timestamp_start: logsTimestampFrom,
          iso_timestamp_end: logsTimestampTo,
        },
        {}
      ),
    [project?.ref, logsTimestampFrom, logsTimestampTo]
  )

  // [Logs] Fetch chart data
  const {
    data: logsChartResponse,
    isLoading: isLoadingLogs,
    error: logsError,
    isRefetching: isRefetchingLogs,
  } = useQuery(
    [
      'projects',
      project?.ref,
      'logs-chart',
      {
        sql: chartQuery,
        iso_timestamp_start: logsTimestampFrom,
        iso_timestamp_end: logsTimestampTo,
      },
    ],
    ({ signal }) =>
      get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: project?.ref as string },
          query: {
            iso_timestamp_start: logsTimestampFrom,
            iso_timestamp_end: logsTimestampTo,
            project: project?.ref as string,
            sql: chartQuery,
          },
        },
        signal,
      }),
    { refetchOnWindowFocus: false }
  )
  const normalizedLogsChartData = useTimeseriesUnixToIso(
    logsChartResponse?.data?.result ?? [],
    'timestamp'
  )
  const { data: logsEventChartData, error: logsChartError } = useFillTimeseriesSorted(
    normalizedLogsChartData,
    'timestamp',
    'count',
    0,
    logsTimestampFrom,
    logsTimestampTo
  )

  const CombinedLogsError = logsError || logsChartError

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  // [Total Requests] Define count queries
  const edgeLogsCountSql = useMemo(() => `SELECT count(*) as count FROM ${LogsTableName.EDGE}`, [])
  const authLogsCountSql = useMemo(() => `SELECT count(*) as count FROM ${LogsTableName.AUTH}`, [])

  // [Total Requests] Fetch counts
  const { data: edgeLogsCountData, isLoading: isLoadingEdgeCount } = useQuery(
    [
      'projects',
      project?.ref,
      'logs-count',
      LogsTableName.EDGE,
      { iso_timestamp_start: logsTimestampFrom, iso_timestamp_end: logsTimestampTo },
    ],
    ({ signal }) =>
      get<Count>(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: project?.ref as string },
          query: {
            sql: edgeLogsCountSql,
            project: project?.ref as string,
            iso_timestamp_start: logsTimestampFrom,
            iso_timestamp_end: logsTimestampTo,
          },
        },
        signal,
      }),
    { refetchOnWindowFocus: false }
  )

  const { data: authLogsCountData, isLoading: isLoadingAuthCount } = useQuery(
    [
      'projects',
      project?.ref,
      'logs-count',
      LogsTableName.AUTH,
      { iso_timestamp_start: logsTimestampFrom, iso_timestamp_end: logsTimestampTo },
    ],
    ({ signal }) =>
      get<Count>(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: project?.ref as string },
          query: {
            sql: authLogsCountSql,
            project: project?.ref as string,
            iso_timestamp_start: logsTimestampFrom,
            iso_timestamp_end: logsTimestampTo,
          },
        },
        signal,
      }),
    { refetchOnWindowFocus: false }
  )

  const edgeCount = useMemo(
    () => edgeLogsCountData?.data?.result?.[0]?.count ?? 0,
    [edgeLogsCountData]
  )
  const authCount = useMemo(
    () => authLogsCountData?.data?.result?.[0]?.count ?? 0,
    [authLogsCountData]
  )
  const totalRequests = useMemo(() => edgeCount + authCount, [edgeCount, authCount])
  const isLoadingTotalRequests = isLoadingEdgeCount || isLoadingAuthCount

  // [Reports] Fetch reports content
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

  // [Reports] Set default time range (last 3 days)
  const defaultReportDateHelper = useMemo(
    () =>
      getDefaultHelper(
        PREVIEWER_DATEPICKER_HELPERS.filter((helper) => helper.text === 'Last 3 days')
      ),
    []
  )
  const reportStartDate = useMemo(
    () => defaultReportDateHelper.calcFrom(),
    [defaultReportDateHelper]
  )
  const reportEndDate = useMemo(() => defaultReportDateHelper.calcTo(), [defaultReportDateHelper])
  // Assuming a default interval is okay, might need adjustment
  const reportInterval: AnalyticsInterval = '1d'

  return (
    <div className="mx-auto w-full my-12 md:my-16 space-y-12 md:space-y-16 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-3xl">{projectName}</h1>
          {isOrioleDb && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="warning">OrioleDB</Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-80 text-center">
                This project is using Postgres with OrioleDB which is currently in preview and not
                suitable for production workloads. View our{' '}
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
        <div className="flex items-center gap-x-3">
          {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <SecurityStatus />}
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <ServiceStatus />}
        </div>
      </div>

      <div className="mx-6">
        <ProjectUpgradeFailedBanner />
      </div>
      {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState />}

      {project?.status !== PROJECT_STATUS.INACTIVE && (
        <>
          {/* Section 1: Infrastructure */}
          {/* <div className="space-y-4">
            <h3 className="text-xl">Infrastructure</h3>
            <ReactFlowProvider>
              <InstanceConfiguration />
            </ReactFlowProvider>
          </div> */}

          {/* Section 2: Logs Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl">Database Logs (Last Hour)</h3>
              <Button asChild type="default" size="tiny">
                <Link
                  href={`/project/${project?.ref}/logs/explorer?its=${encodeURIComponent(
                    logsTimestampTo
                  )}&ite=${encodeURIComponent(logsTimestampFrom)}`}
                >
                  Explore in Logs Explorer
                </Link>
              </Button>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <p className="text-sm text-foreground-light">Total Requests (API + Auth)</p>
                {isLoadingTotalRequests ? (
                  <ShimmeringLoader className="w-16 h-8" />
                ) : (
                  <p className="text-2xl">{totalRequests.toLocaleString()}</p>
                )}
              </div>
              {(isLoadingLogs || isRefetchingLogs) && (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}
              {CombinedLogsError && (
                <AlertError error={CombinedLogsError as any} subject="Failed to load logs" />
              )}
              {!(isLoadingLogs || isRefetchingLogs) && !CombinedLogsError && (
                <LogsBarChart
                  data={logsEventChartData as any} // Type mismatch between hook and chart
                  DateTimeFormat="MMM D, YYYY, HH:mm"
                  EmptyState={
                    <div className="flex flex-col items-center justify-center h-[80px]">
                      <h2 className="text-foreground-light text-sm">No log data</h2>
                      <p className="text-foreground-lighter text-xs">
                        There were no Postgres logs found in the last hour
                      </p>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* Section 3: Embedded Report */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl">{firstReport ? firstReport.name : 'Custom Report'}</h3>
              <Button asChild type="default" size="tiny">
                <Link href={`/project/${project?.ref}/reports`}>View All Reports</Link>
              </Button>
            </div>
            <Card>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {reportContent.layout.map((item: Dashboards.Chart) => (
                    <ReportBlock
                      key={item.id}
                      item={item}
                      startDate={reportStartDate}
                      endDate={reportEndDate}
                      interval={reportInterval}
                      disableUpdate={true}
                      isRefreshing={false}
                      // Dummy callbacks as disableUpdate is true
                      onRemoveChart={() => {}}
                      onUpdateChart={() => {}}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Removed original sections: ProjectUsageSection, Client libraries, Example projects */}
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
