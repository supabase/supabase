import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useUnifiedLogsPreview } from '../App/FeaturePreview/FeaturePreviewContext'
import { DatabaseInfrastructureSection } from './DatabaseInfrastructureSection'
import { OBSERVABILITY_DOCS_HREFS } from './Observability.constants'
import { useObservabilityOverviewData } from './ObservabilityOverview.utils'
import { ObservabilityOverviewFooter } from './ObservabilityOverviewFooter'
import { ServiceHealthTable } from './ServiceHealthTable'
import { useSlowQueriesCount } from './useSlowQueriesCount'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import { DocsButton } from '@/components/ui/DocsButton'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from '@/components/ui/Logs/logs.utils'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const REPORT_TITLE = 'Overview'

type ChartIntervalKey = '1hr' | '1day' | '7day'

export const ObservabilityOverview = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const queryClient = useQueryClient()

  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const { projectStorageAll: storageSupported } = useIsFeatureEnabled(['project_storage:all'])
  const { isEnabled: isDataApiEnabled } = useIsDataApiEnabled({ projectRef })

  const DEFAULT_INTERVAL: ChartIntervalKey = '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false)

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
    queryClient.invalidateQueries({ queryKey: ['projects', projectRef, 'service-health'] })
    queryClient.invalidateQueries({ queryKey: ['project-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['infra-monitoring'] })
    queryClient.invalidateQueries({ queryKey: ['max-connections'] })
  }, [queryClient, projectRef])

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, handleRefresh)
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowIntervalDropdown((open) => !open)
  })

  const serviceBase = useMemo(
    () => [
      {
        key: 'data_api' as const,
        name: 'API Gateway',
        reportUrl: undefined,
        logsUrl: `/project/${projectRef}/logs/edge-logs`,
        enabled: isDataApiEnabled,
        hasReport: false,
      },
      {
        key: 'db' as const,
        name: 'Database',
        reportUrl: `/project/${projectRef}/observability/database`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:postgres`
          : `/project/${projectRef}/logs/postgres-logs`,
        enabled: true,
        hasReport: true,
      },
      {
        key: 'postgrest' as const,
        name: 'PostgREST',
        reportUrl: `/project/${projectRef}/observability/postgrest`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:postgrest`
          : `/project/${projectRef}/logs/postgrest-logs`,
        enabled: true,
        hasReport: true,
      },
      {
        key: 'auth' as const,
        name: 'Auth',
        reportUrl: `/project/${projectRef}/observability/auth`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:auth`
          : `/project/${projectRef}/logs/auth-logs`,
        enabled: true,
        hasReport: true,
      },
      {
        key: 'functions' as const,
        name: 'Edge Functions',
        reportUrl: `/project/${projectRef}/observability/edge-functions`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:edge+function`
          : `/project/${projectRef}/logs/edge-functions-logs`,
        enabled: true,
        hasReport: true,
      },
      {
        key: 'storage' as const,
        name: 'Storage',
        reportUrl: `/project/${projectRef}/observability/storage`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:storage`
          : `/project/${projectRef}/logs/storage-logs`,
        enabled: storageSupported,
        hasReport: true,
      },
      {
        key: 'realtime' as const,
        name: 'Realtime',
        reportUrl: `/project/${projectRef}/observability/realtime`,
        logsUrl: isUnifiedLogsEnabled
          ? `/project/${projectRef}/logs?filter=log_type:eq:realtime`
          : `/project/${projectRef}/logs/realtime-logs`,
        enabled: true,
        hasReport: true,
      },
    ],
    [projectRef, storageSupported, isDataApiEnabled, isUnifiedLogsEnabled]
  )

  const enabledServices = serviceBase.filter((s) => s.enabled)

  const dbServiceData = overviewData.services.db

  // Navigate to the log view scoped to the clicked bar's bucket window
  const handleBarClick = useCallback(
    (logsUrl: string) => (datum: any) => {
      if (!datum?.timestamp) return

      // datum.timestamp is already the UTC-truncated bucket boundary from timestamp_trunc(),
      // so use it directly to avoid local-timezone startOf() misalignment (e.g. UTC+5:30).
      const unit = interval === '1hr' ? 'minute' : 'hour'
      const start = datum.timestamp
      const end = dayjs.utc(datum.timestamp).add(1, unit).toISOString()

      const queryParams = new URLSearchParams({ its: start, ite: end })
      const separator = logsUrl.includes('?') ? '&' : '?'
      router.push(`${logsUrl}${separator}${queryParams.toString()}`)
    },
    [router, interval]
  )

  return (
    <ReportPadding>
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <ReportHeader title={REPORT_TITLE} />
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
          <DocsButton href={OBSERVABILITY_DOCS_HREFS.overview} topic={REPORT_TITLE} />
          <ShortcutTooltip
            shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
            label="Refresh report"
            side="bottom"
          >
            <Button variant="outline" icon={<RefreshCw size={14} />} onClick={handleRefresh}>
              Refresh
            </Button>
          </ShortcutTooltip>
          <ChartIntervalDropdown
            value={interval}
            onChange={(interval) => setInterval(interval as ChartIntervalKey)}
            organizationSlug={organization?.slug}
            dropdownAlign="end"
            tooltipSide="left"
            open={showIntervalDropdown}
            onOpenChange={setShowIntervalDropdown}
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
          datetimeFormat={datetimeFormat}
        />
      </div>

      <ObservabilityOverviewFooter />
    </ReportPadding>
  )
}
