import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import { ChartIntervalDropdown } from 'components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from 'components/ui/Logs/logs.utils'
import dayjs from 'dayjs'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { DatabaseInfrastructureSection } from './DatabaseInfrastructureSection'
import { useObservabilityOverviewData } from './ObservabilityOverview.utils'
import { ObservabilityOverviewFooter } from './ObservabilityOverviewFooter'
import { ServiceHealthTable } from './ServiceHealthTable'
import { useSlowQueriesCount } from './useSlowQueriesCount'

type ChartIntervalKey = '1hr' | '1day' | '7day'

export const ObservabilityOverview = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { plan } = useCurrentOrgPlan()
  const queryClient = useQueryClient()

  const authReportEnabled = useFlag('authreportv2')
  const edgeFnReportEnabled = useFlag('edgefunctionreport')
  const realtimeReportEnabled = useFlag('realtimeReport')
  const storageReportEnabled = useFlag('storagereport')
  const postgrestReportEnabled = useFlag('postgrestreport')
  const { projectStorageAll: storageSupported } = useIsFeatureEnabled(['project_storage:all'])

  const DEFAULT_INTERVAL: ChartIntervalKey = '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { datetimeFormat } = useMemo(() => {
    const format = selectedInterval.format || 'MMM D, ha'
    return { datetimeFormat: format }
  }, [selectedInterval])

  const overviewData = useObservabilityOverviewData(projectRef!, interval, refreshKey)

  const { slowQueriesCount, isLoading: slowQueriesLoading } = useSlowQueriesCount(
    projectRef,
    refreshKey
  )

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    queryClient.invalidateQueries({ queryKey: ['project-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['postgrest-overview-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['infra-monitoring'] })
    queryClient.invalidateQueries({ queryKey: ['max-connections'] })
  }, [queryClient])

  const serviceBase = useMemo(
    () => [
      {
        key: 'db' as const,
        name: 'Database',
        reportUrl: `/project/${projectRef}/observability/database`,
        logsUrl: `/project/${projectRef}/logs/postgres-logs`,
        enabled: true,
        hasReport: true,
      },
      {
        key: 'auth' as const,
        name: 'Auth',
        reportUrl: `/project/${projectRef}/observability/auth`,
        logsUrl: `/project/${projectRef}/logs/auth-logs`,
        enabled: true,
        hasReport: authReportEnabled,
      },
      {
        key: 'functions' as const,
        name: 'Edge Functions',
        reportUrl: `/project/${projectRef}/observability/edge-functions`,
        logsUrl: `/project/${projectRef}/logs/edge-functions-logs`,
        enabled: true,
        hasReport: edgeFnReportEnabled,
      },
      {
        key: 'realtime' as const,
        name: 'Realtime',
        reportUrl: `/project/${projectRef}/observability/realtime`,
        logsUrl: `/project/${projectRef}/logs/realtime-logs`,
        enabled: true,
        hasReport: realtimeReportEnabled,
      },
      {
        key: 'storage' as const,
        name: 'Storage',
        reportUrl: `/project/${projectRef}/observability/storage`,
        logsUrl: `/project/${projectRef}/logs/storage-logs`,
        enabled: storageSupported,
        hasReport: storageReportEnabled,
      },
      {
        key: 'postgrest' as const,
        name: 'Data API',
        reportUrl: `/project/${projectRef}/observability/postgrest`,
        logsUrl: `/project/${projectRef}/logs/postgrest-logs`,
        enabled: true,
        hasReport: postgrestReportEnabled,
      },
    ],
    [
      projectRef,
      authReportEnabled,
      edgeFnReportEnabled,
      realtimeReportEnabled,
      storageReportEnabled,
      storageSupported,
      postgrestReportEnabled,
    ]
  )

  const enabledServices = serviceBase.filter((s) => s.enabled)

  const dbServiceData = overviewData.services.db

  // Creates a 1-hour time window for the clicked bar for log filtering
  const handleBarClick = useCallback(
    (serviceKey: string, logsUrl: string) => (datum: any) => {
      if (!datum?.timestamp) return

      const datumTimestamp = dayjs(datum.timestamp)
      // Round down to the start of the hour
      const start = datumTimestamp.startOf('hour').toISOString()
      // Add 1 hour to get the end of the hour
      const end = datumTimestamp.startOf('hour').add(1, 'hour').toISOString()

      const queryParams = new URLSearchParams({
        its: start,
        ite: end,
      })

      router.push(`${logsUrl}?${queryParams.toString()}`)
    },
    [router]
  )

  return (
    <ReportPadding>
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <ReportHeader title="Overview" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="warning">Beta</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This page is subject to change</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Button type="outline" icon={<RefreshCw size={14} />} onClick={handleRefresh}>
            Refresh
          </Button>
          <ChartIntervalDropdown
            value={interval}
            onChange={(interval) => setInterval(interval as ChartIntervalKey)}
            planId={plan?.id}
            planName={plan?.name}
            organizationSlug={organization?.slug}
            dropdownAlign="end"
            tooltipSide="left"
          />
        </div>
      </div>

      <div className="space-y-12 mt-8">
        <DatabaseInfrastructureSection
          interval={interval}
          refreshKey={refreshKey}
          dbErrorRate={dbServiceData.errorRate}
          isLoading={dbServiceData.isLoading}
          slowQueriesCount={slowQueriesCount}
          slowQueriesLoading={slowQueriesLoading}
        />

        <ServiceHealthTable
          services={enabledServices.map((service) => ({
            key: service.key,
            name: service.name,
            description: '',
            reportUrl: service.hasReport ? service.reportUrl : undefined,
            logsUrl: service.logsUrl,
          }))}
          serviceData={overviewData.services}
          onBarClick={handleBarClick}
          interval={interval}
          datetimeFormat={datetimeFormat}
        />
      </div>

      <ObservabilityOverviewFooter />
    </ReportPadding>
  )
}
