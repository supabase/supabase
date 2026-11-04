import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRightIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { OBSERVABILITY_DOCS_HREFS } from '@/components/interfaces/Observability/Observability.constants'
import { EgressDebugButton } from '@/components/interfaces/Organization/Usage/EgressDebugButton'
import { TopApiRoutesRenderer } from '@/components/interfaces/Reports/renderers/ApiRenderers'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from '@/components/interfaces/Reports/renderers/StorageRenderers'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import {
  DatePickerValue,
  LogsDatePicker,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import type { NextPageWithLayout } from '@/types'

const REPORT_TITLE = 'Egress'

export const EgressReport: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const orgSlug = selectedOrg?.slug
  const { data, error, params, isLoading, mergeParams, refresh } = useEgressReport()

  const {
    datePickerHelpers,
    datePickerValue,
    handleDatePickerChange: handleDatePickerChangeFromHook,
    showUpgradePrompt,
    setShowUpgradePrompt,
    selectedDateRange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const handleDatepickerChange = (vals: DatePickerValue) => {
    const promptShown = handleDatePickerChangeFromHook(vals)
    if (!promptShown) {
      mergeParams({
        iso_timestamp_start: vals.from ?? '',
        iso_timestamp_end: vals.to ?? '',
      })
    }
  }

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatepickerChange,
    refresh
  )

  const [showDatePicker, setShowDatePicker] = useState(false)

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, onRefreshReport, { enabled: !isLoading })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

  const usageUrl = orgSlug ? `/org/${orgSlug}/usage#egress` : undefined

  return (
    <ReportPadding>
      <ReportHeader title={REPORT_TITLE} showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <EgressDebugButton projectRef={projectRef} orgSlug={orgSlug} />
            <DocsButton href={OBSERVABILITY_DOCS_HREFS.egress} topic={REPORT_TITLE} />
            <ShortcutTooltip
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
              label="Refresh report"
              side="bottom"
            >
              <Button
                aria-label="Refresh report"
                disabled={isLoading}
                icon={<RefreshCwIcon className={isLoading ? 'animate-spin' : ''} />}
                className="w-7"
                onClick={onRefreshReport}
              />
            </ShortcutTooltip>
            <LogsDatePicker
              onSubmit={handleDatepickerChange}
              value={datePickerValue}
              helpers={datePickerHelpers}
              open={showDatePicker}
              onOpenChange={setShowDatePicker}
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
            />
            {selectedDateRange && (
              <div className="flex items-center gap-x-2 text-xs">
                <p className="text-foreground-light">
                  {dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')}
                </p>
                <p className="text-foreground-light">
                  <ArrowRightIcon size={12} />
                </p>
                <p className="text-foreground-light">
                  {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
                </p>
              </div>
            )}
            <UpgradePrompt
              show={showUpgradePrompt}
              setShowUpgradePrompt={setShowUpgradePrompt}
              title="Report date range"
              description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
              source="egressReportDateRange"
            />
          </div>
        }
      >
        <div className="mt-8 flex flex-col gap-4">
          <Admonition type="default" title="How to read this report">
            <p>
              Egress is billed by GB. This report ranks traffic by request count, so you can find
              the paths that drive the most calls. API gateway logs do not yet include response
              bytes, so these tables are not GB totals.
            </p>
            {usageUrl !== undefined && (
              <p className="mt-2">
                For egress GB by service, see the{' '}
                <a className="underline" href={usageUrl}>
                  organization usage page
                </a>
                .
              </p>
            )}
          </Admonition>

          <ReportWidget
            isLoading={isLoading}
            params={params.topRoutes}
            title="Top API paths by requests"
            tooltip="Paths with the most requests. High-volume paths that return large responses drive the most egress."
            data={data.topRoutes || []}
            error={error.topRoutes}
            renderer={TopApiRoutesRenderer}
          />

          <ReportWidget
            isLoading={isLoading}
            title="Request caching"
            tooltip="The share of storage requests served from the edge cache. A higher hit rate lowers uncached egress."
            data={data.cacheHitRate || []}
            error={error.cacheHitRate}
            renderer={CacheHitRateChartRenderer}
            append={TopCacheMissesRenderer}
            appendProps={{ data: data.topCacheMisses || [] }}
          />
        </div>
      </ReportStickyNav>
      <div className="py-8">
        <ObservabilityLink />
      </div>
    </ReportPadding>
  )
}

EgressReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Egress">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default EgressReport
