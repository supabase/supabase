import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ReportsLayout } from 'components/layouts'
import {
  PRESET_CONFIG,
  REPORTS_DATEPICKER_HELPERS,
} from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import { useEffect, useMemo } from 'react'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { DatePickerToFrom, LogsEndpointParams } from 'components/interfaces/Settings/Logs'
import { useParams } from 'common'
import ShimmerLine from 'components/ui/ShimmerLine'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import DatePickers from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks'

export const StorageReport: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const report = useStorageReport()

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const plan = subscription?.plan

  const handleDatepickerChange = ({ from, to }: DatePickerToFrom) => {
    report.mergeParams({
      iso_timestamp_start: from || '',
      iso_timestamp_end: to || '',
    })
  }

  const datepickerHelpers = useMemo(
    () =>
      REPORTS_DATEPICKER_HELPERS.map((helper, index) => ({
        ...helper,
        disabled: (index > 0 && plan?.id === 'free') || (index > 1 && plan?.id !== 'pro'),
      })),
    []
  )

  return (
    <ReportPadding>
      <ReportHeader title="Storage" isLoading={report.isLoading} onRefresh={report.refresh} />
      <div className="w-full flex flex-col gap-1">
        <div>
          <DatePickers
            onChange={handleDatepickerChange}
            to={report.params.cacheHitRate.iso_timestamp_end || ''}
            from={report.params.cacheHitRate.iso_timestamp_start || ''}
            helpers={datepickerHelpers}
          />
        </div>
        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
        </div>
      </div>

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.cacheHitRate}
        title="Request Caching"
        tooltip="The number of storage requests that are cached at the edge level. A higher number of hits is better."
        data={report.data.cacheHitRate || []}
        renderer={CacheHitRateChartRenderer}
        append={TopCacheMissesRenderer}
        appendProps={{ data: report.data.topCacheMisses || [] }}
      />
    </ReportPadding>
  )
}

// hook to fetch data
const useStorageReport = () => {
  const { ref: projectRef } = useParams()

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    projectRef ?? 'default'
  )
  const cacheHitRate = queryHooks.cacheHitRate()
  const topCacheMisses = queryHooks.topCacheMisses()
  const activeHooks = [cacheHitRate, topCacheMisses]

  const handleRefresh = async () => {
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
    })
  }
  useEffect(() => {
    if (cacheHitRate.changeQuery) {
      cacheHitRate.changeQuery(PRESET_CONFIG.storage.queries.cacheHitRate.sql([]))
    }

    if (topCacheMisses.changeQuery) {
      topCacheMisses.changeQuery(PRESET_CONFIG.storage.queries.topCacheMisses.sql([]))
    }
  }, [])
  const isLoading = activeHooks.some((hook) => hook.isLoading)
  return {
    data: {
      cacheHitRate: cacheHitRate.logData,
      topCacheMisses: topCacheMisses.logData,
    },
    params: {
      cacheHitRate: cacheHitRate.params,
      topCacheMisses: topCacheMisses.params,
    },
    mergeParams: handleSetParams,
    isLoading,
    refresh: handleRefresh,
  }
}

StorageReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(StorageReport)
