import { useMemo } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { REPORTS_DATEPICKER_HELPERS } from 'components/interfaces/Reports/Reports.constants'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import DatePickers from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import type { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useStorageReport } from 'data/reports/storage-report-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { RefreshCw } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()
  const organization = useSelectedOrganization()

  const { isLoading, refresh } = report

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
      <ReportHeader title="Storage" />
      <div className="w-full flex flex-col gap-1">
        <div className="flex items-center gap-x-2">
          <ButtonTooltip
            type="default"
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
            onClick={() => refresh()}
          />
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

StorageReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout>{page}</ReportsLayout>
  </DefaultLayout>
)

export default StorageReport
