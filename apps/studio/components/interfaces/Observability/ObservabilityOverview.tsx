import { useParams, useFlag } from 'common'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import { ChevronDown, RefreshCw } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { InlineLink } from 'components/ui/InlineLink'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import { ServiceHealthTable } from './ServiceHealthTable'
import { DatabaseInfrastructureSection } from './DatabaseInfrastructureSection'
import { useObservabilityOverviewData } from './ObservabilityOverview.utils'
import type { ChartIntervals } from 'types'

const LOG_RETENTION = { free: 1, pro: 7, team: 28, enterprise: 90, platform: 1 }

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '1hr',
    label: 'Last 60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '1day',
    label: 'Last 24 hours',
    startValue: 24,
    startUnit: 'hour',
    format: 'MMM D, ha',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '7day',
    label: 'Last 7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D, ha',
    availableIn: ['pro', 'team', 'enterprise'],
  },
]

type ChartIntervalKey = '1hr' | '1day' | '7day'

export const ObservabilityOverview = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { plan } = useCurrentOrgPlan()
  const queryClient = useQueryClient()

  // Feature flags for report availability
  const authReportEnabled = useFlag('authreportv2')
  const edgeFnReportEnabled = useFlag('edgefunctionreport')
  const realtimeReportEnabled = useFlag('realtimeReport')
  const storageReportEnabled = useFlag('storagereport')
  const postgrestReportEnabled = useFlag('postgrestreport')
  const { projectStorageAll: storageSupported } = useIsFeatureEnabled(['project_storage:all'])

  // Time interval selection
  const DEFAULT_INTERVAL: ChartIntervalKey = plan?.id === 'free' ? '1hr' : '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { datetimeFormat } = useMemo(() => {
    const format = selectedInterval.format || 'MMM D, ha'
    return { datetimeFormat: format }
  }, [selectedInterval])

  // Data fetching
  const overviewData = useObservabilityOverviewData(projectRef!, interval)

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    queryClient.invalidateQueries({ queryKey: ['project-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['postgrest-overview-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['infra-monitoring'] })
    queryClient.invalidateQueries({ queryKey: ['max-connections'] })
  }, [queryClient])

  // Service configuration
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

  // Database data
  const dbServiceData = overviewData.services.db

  // Bar click handler - navigate to logs with 2-minute window
  const handleBarClick = useCallback(
    (serviceKey: string, logsUrl: string) => (datum: any) => {
      if (!datum?.timestamp) return

      const datumTimestamp = dayjs(datum.timestamp).toISOString()
      const start = dayjs(datumTimestamp).subtract(1, 'minute').toISOString()
      const end = dayjs(datumTimestamp).add(1, 'minute').toISOString()

      const queryParams = new URLSearchParams({
        iso_timestamp_start: start,
        iso_timestamp_end: end,
      })

      router.push(`${logsUrl}?${queryParams.toString()}`)
    },
    [router]
  )

  // Database bar click handler
  const handleDbBarClick = useCallback(
    handleBarClick('db', `/project/${projectRef}/logs/postgres-logs`),
    [handleBarClick, projectRef]
  )

  return (
    <ReportPadding>
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <ReportHeader title="Overview" />
          <Badge variant="warning">Beta</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="outline"
            icon={<RefreshCw size={14} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" iconRight={<ChevronDown size={14} />}>
              <span>{selectedInterval.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={interval}
              onValueChange={(interval) => setInterval(interval as ChartIntervalKey)}
            >
              {CHART_INTERVALS.map((i) => {
                const disabled = !i.availableIn?.includes(plan?.id || 'free')

                if (disabled) {
                  const retentionDuration = LOG_RETENTION[plan?.id ?? 'free']
                  return (
                    <Tooltip key={i.key}>
                      <TooltipTrigger asChild>
                        <DropdownMenuRadioItem
                          disabled
                          value={i.key}
                          className="!pointer-events-auto"
                        >
                          {i.label}
                        </DropdownMenuRadioItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>
                          {plan?.name} plan only includes up to {retentionDuration} day
                          {retentionDuration > 1 ? 's' : ''} of log retention
                        </p>
                        <p className="text-foreground-light">
                          <InlineLink
                            className="text-foreground-light hover:text-foreground"
                            href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}
                          >
                            Upgrade your plan
                          </InlineLink>{' '}
                          to increase log retention and view statistics for the{' '}
                          {i.label.toLowerCase()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                } else {
                  return (
                    <DropdownMenuRadioItem key={i.key} value={i.key}>
                      {i.label}
                    </DropdownMenuRadioItem>
                  )
                }
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

<div className='space-y-12 mt-8'>

      <DatabaseInfrastructureSection
        interval={interval}
        refreshKey={refreshKey}
        dbErrorRate={dbServiceData.errorRate}
        dbChartData={dbServiceData.eventChartData}
        dbErrorCount={dbServiceData.errorCount}
        dbWarningCount={dbServiceData.warningCount}
        isLoading={dbServiceData.isLoading}
        onBarClick={handleDbBarClick}
        datetimeFormat={datetimeFormat}
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

    </ReportPadding>
  )
}
