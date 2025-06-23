import { useState } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  createFilteredDatePickerHelpers,
  REPORTS_DATEPICKER_HELPERS,
} from 'components/interfaces/Reports/Reports.constants'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import {
  DatePickerValue,
  LogsDatePicker,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useStorageReport } from 'data/reports/storage-report-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { RefreshCw } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()
  const organization = useSelectedOrganization()

  const { isLoading, refresh } = report

  const plan = organization?.plan

  const defaultHelper =
    REPORTS_DATEPICKER_HELPERS.find((h) => h.default) || REPORTS_DATEPICKER_HELPERS[0]

  const [selectedRange, setSelectedRange] = useState<DatePickerValue>({
    to: defaultHelper.calcTo(),
    from: defaultHelper.calcFrom(),
    isHelper: true,
    text: defaultHelper.text,
  })

  const datepickerHelpers = createFilteredDatePickerHelpers(plan?.id || 'free')

  const handleDatepickerChange = (vals: DatePickerValue) => {
    report.mergeParams({
      iso_timestamp_start: vals.from || '',
      iso_timestamp_end: vals.to || '',
    })
    setSelectedRange(vals)
  }

  return (
    <ReportPadding>
      <ReportHeader title="Storage" />
      <div className="w-full flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <ButtonTooltip
            type="default"
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
            onClick={() => refresh()}
          />

          <LogsDatePicker
            onSubmit={handleDatepickerChange}
            value={selectedRange}
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
