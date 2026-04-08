import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { QueryInsights } from '@/components/interfaces/QueryInsights/QueryInsights'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const PRESETS = [
  REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES,
  REPORT_DATERANGE_HELPER_LABELS.LAST_3_HOURS,
  REPORT_DATERANGE_HELPER_LABELS.LAST_24_HOURS,
]

const QueryInsightsReport: NextPageWithLayout = () => {
  const { selectedDateRange, datePickerValue, datePickerHelpers, handleDatePickerChange } =
    useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const handleSelect = (text: string) => {
    const helper = datePickerHelpers.find((h) => h.text === text)
    if (helper) {
      handleDatePickerChange({ from: helper.calcFrom(), to: helper.calcTo(), isHelper: true, text })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="w-full mb-0 flex lg:items-center justify-between gap-4 py-2 px-6 lg:flex-row flex-col border-b lg:h-[48px]">
        <h3 className="text-foreground text-xl prose">Query Insights</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <DocsButton
            href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
          />
          <DatabaseSelector />
          <Select_Shadcn_
            value={datePickerValue.isHelper ? datePickerValue.text : undefined}
            onValueChange={handleSelect}
          >
            <SelectTrigger_Shadcn_ size="tiny" className="w-[150px]">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_ align="end">
              {PRESETS.map((label) => (
                <SelectItem_Shadcn_ key={label} value={label}>
                  {label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
      </div>
      <QueryInsights dateRange={selectedDateRange} />
    </div>
  )
}

QueryInsightsReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Query insights">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default QueryInsightsReport
