import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, BookOpen, ExternalLink, Info, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, Image, cn } from 'ui'

import { useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ChartHandler from 'components/ui/Charts/ChartHandler'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import Panel from 'components/ui/Panel'
import { analyticsKeys } from 'data/analytics/keys'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { formatBytes } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { title } from 'process'
import { TelemetryActions } from 'common/telemetry-constants'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

const DatabaseReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <DatabaseUsage />
    </ReportPadding>
  )
}

DatabaseReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Database">{page}</ReportsLayout>
  </DefaultLayout>
)

export default DatabaseReport

const REPORT_ATTRIBUTES = [
  { id: 'ram_usage', label: 'Memory usage' },
  { id: 'avg_cpu_usage', label: 'Average CPU usage' },
  { id: 'max_cpu_usage', label: 'Max CPU usage' },
  { id: 'disk_io_consumption', label: 'Disk IO consumed' },
  { id: 'pg_stat_database_num_backends', label: 'Number of database connections' },
]

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { project } = useProjectContext()
  const queryClient = useQueryClient()

  const state = useDatabaseSelectorStateSnapshot()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<any>(undefined)

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const report = useDatabaseReport()
  const { data, params, largeObjectsSql, isLoading, refresh } = report

  const { data: databaseSizeData } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSizeBytes = databaseSizeData ?? 0
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const [showIncreaseDiskSizeModal, setshowIncreaseDiskSizeModal] = useState(false)
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { isLoading: isUpdatingDiskSize } = useProjectDiskResizeMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
      setshowIncreaseDiskSizeModal(false)
    },
  })

  const onRefreshReport = async () => {
    if (!dateRange) return

    // [Joshen] Since we can't track individual loading states for each chart
    // so for now we mock a loading state that only lasts for a second
    setIsRefreshing(true)
    refresh()
    const { period_start, interval } = dateRange
    REPORT_ATTRIBUTES.forEach((attr) => {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: attr.id,
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    })
    if (isReplicaSelected) {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: 'physical_replication_lag_physical_replica_lag_seconds',
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // [Joshen] Empty dependency array as we only want this running once
  useEffect(() => {
    if (db !== undefined) {
      setTimeout(() => {
        // [Joshen] Adding a timeout here to support navigation from settings to reports
        // Both are rendering different instances of ProjectLayout which is where the
        // DatabaseSelectorContextProvider lies in (unless we reckon shifting the provider up one more level is better)
        state.setSelectedDatabaseId(db)
      }, 100)
    }
    if (chart !== undefined) {
      setTimeout(() => {
        const el = document.getElementById(chart)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
  }, [db, chart])

  return (
    <>
      <ReportHeader showDatabaseSelector title="Database" />
      <Alert_Shadcn_ className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={{
              dark: '/img/reports/bg-grafana-dark.svg',
              light: '/img/reports/bg-grafana-light.svg',
            }}
            alt="Supabase Grafana"
            fill
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>
        <svg
          width="78"
          height="86"
          viewBox="0 0 78 86"
          className="w-4 h-4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M77.7769 38.1475C77.6278 36.8038 77.4783 35.1614 76.8811 33.3698C76.4331 31.5782 75.6868 29.6373 74.6416 27.547C73.5964 25.4568 72.2529 23.3665 70.6105 21.2763C70.0134 20.5298 69.2667 19.634 68.371 18.8875C69.5653 14.1098 66.878 10.0787 66.878 10.0787C62.3989 9.78003 59.4127 11.4224 58.3675 12.3182C58.2184 12.3182 58.0689 12.1689 57.7703 12.0196C57.0241 11.721 56.2774 11.4224 55.3817 11.1238C54.4859 10.8251 53.7393 10.6759 52.8435 10.3772C51.9478 10.2279 51.0516 10.0787 50.3054 9.92932C50.1559 9.92932 50.0068 9.92932 49.8573 9.92932C47.9163 3.65863 42.2429 0.971191 42.2429 0.971191C35.9722 5.00236 34.7778 10.5266 34.7778 10.5266C34.7778 10.5266 34.7778 10.6759 34.7778 10.8251C34.4792 10.9744 34.0313 10.9744 33.7327 11.1238C33.2848 11.2731 32.8369 11.4224 32.2397 11.5717C31.7917 11.721 31.3439 11.8703 30.7466 12.1689C29.8508 12.6168 28.8057 13.0647 27.9099 13.5126C27.0141 13.9605 26.1183 14.5577 25.2225 15.1549C25.0732 15.1549 25.0732 15.0056 25.0732 15.0056C16.2643 11.721 8.50058 15.7521 8.50058 15.7521C7.75408 25.0089 11.9345 30.981 12.8304 32.0261C12.681 32.6233 12.3825 33.2205 12.2332 33.8177C11.636 35.908 11.0387 38.1475 10.7401 40.3872C10.7401 40.6857 10.5908 40.9843 10.5908 41.2829C2.52849 45.314 0.139648 53.5256 0.139648 53.5256C6.85826 61.2895 14.7713 61.7372 14.7713 61.7372C15.8164 63.529 16.8615 65.1711 18.2052 66.8135C18.8024 67.4106 19.3997 68.1573 19.8476 68.7544C17.4587 75.7717 20.1462 81.5946 20.1462 81.5946C27.6113 81.8932 32.5383 78.3099 33.5834 77.4141C34.3299 77.7127 35.0764 77.8618 35.8229 78.1607C38.0624 78.7579 40.4514 79.0565 42.84 79.2056C43.4372 79.2056 44.0347 79.2056 44.6319 79.2056H44.9305H45.0796H45.3782H45.6768C49.2601 84.2819 55.3817 85.0285 55.3817 85.0285C59.8608 80.3999 60.0099 75.7717 60.0099 74.7265V74.5774V74.4279C60.9056 73.8307 61.8014 73.0845 62.6975 72.3378C64.489 70.6954 65.9819 68.9039 67.3257 66.9629C67.4752 66.8135 67.6243 66.6644 67.6243 66.3658C72.7006 66.6644 76.1345 63.2305 76.1345 63.2305C75.2387 58.0047 72.2525 55.4665 71.6554 55.0189H71.5063C71.5063 54.7199 71.5063 54.4213 71.5063 54.1227C71.5063 53.5256 71.5063 52.9284 71.5063 52.4807V51.7341V51.5846V51.4355V51.286V50.9874V50.5397C71.5063 50.3903 71.5063 50.2412 71.5063 50.0917C71.5063 49.9426 71.5063 49.7931 71.5063 49.6436V49.1959V48.7479C71.3568 48.1507 71.3568 47.5535 71.2077 47.1055C70.6105 44.8663 69.8639 42.7758 68.6695 40.8349C67.4752 38.894 66.1314 37.2517 64.489 35.7587C62.8466 34.2656 61.0551 33.2205 59.1141 32.3247C57.1732 31.4289 55.2322 30.981 53.1421 30.6824C52.0969 30.5331 51.2011 30.5331 50.1559 30.5331H49.8573H49.7082H49.5587H49.4096H49.111C48.9616 30.5331 48.8121 30.5331 48.663 30.5331C48.2149 30.5331 47.6177 30.6824 47.1701 30.6824C45.2291 30.981 43.2881 31.7275 41.6457 32.7726C40.0033 33.8177 38.5104 35.0121 37.316 36.3559C36.1215 37.6996 35.2257 39.3419 34.6285 40.9843C34.0313 42.6267 33.7327 44.2687 33.5834 45.9111C33.5834 46.3592 33.5834 46.6578 33.5834 47.1055C33.5834 47.255 33.5834 47.255 33.5834 47.4044V47.703C33.5834 47.8521 33.5834 48.1507 33.5834 48.3002C33.7327 49.0464 33.882 49.9426 34.0313 50.6888C34.4792 52.1818 35.2257 53.5256 35.9723 54.7199C36.868 55.9146 37.9132 56.8104 38.9585 57.5566C40.0033 58.3033 41.198 58.9004 42.3924 59.199C43.5867 59.4976 44.6319 59.6471 45.8262 59.6471C45.9753 59.6471 46.1248 59.6471 46.2739 59.6471H46.4234H46.5729C46.722 59.6471 46.8715 59.6471 46.8715 59.6471C46.8715 59.6471 46.8715 59.6471 47.0206 59.6471H47.1701H47.3192C47.4686 59.6471 47.6177 59.6471 47.7672 59.6471C47.9163 59.6471 48.0658 59.6471 48.2149 59.4976C48.5135 59.4976 48.663 59.3485 48.9616 59.3485C49.4096 59.199 49.8573 59.0499 50.3054 58.7513C50.7531 58.6019 51.0516 58.3033 51.4997 58.0047C51.6488 58.0047 51.6492 57.8556 51.7983 57.7061C52.2463 57.4075 52.2463 56.8104 51.9478 56.5118C51.6492 56.2132 51.2011 56.0637 50.9025 56.3623C50.7531 56.3623 50.7531 56.5118 50.604 56.5118C50.3054 56.6609 50.0068 56.8104 49.5587 56.9595C49.2601 57.1089 48.8121 57.1089 48.5135 57.258C48.3644 57.258 48.0658 57.258 47.9163 57.258C47.7672 57.258 47.7672 57.258 47.6177 57.258C47.4686 57.258 47.4686 57.258 47.3192 57.258C47.1701 57.258 47.1701 57.258 47.0206 57.258C46.8715 57.258 46.722 57.258 46.722 57.258H46.5729H46.4234C46.2739 57.258 46.2743 57.258 46.1248 57.258C45.2291 57.1089 44.4824 56.9595 43.5867 56.5118C42.6909 56.2132 41.9443 55.616 41.1976 55.0189C40.4514 54.4213 39.8542 53.5256 39.4061 52.7793C38.9585 52.0327 38.5104 50.9874 38.3609 49.9426C38.2118 49.4945 38.2118 48.8973 38.2118 48.4493C38.2118 48.3002 38.2118 48.1507 38.2118 48.0016V47.8521V47.703C38.2118 47.4044 38.2118 47.1055 38.3609 46.8069C38.809 44.5673 39.8542 42.4772 41.6457 40.6857C42.0938 40.2377 42.5415 39.9391 42.9895 39.491C43.4372 39.1925 44.0347 38.894 44.4824 38.5954C45.0796 38.2968 45.6768 38.1475 46.1248 37.9982C46.722 37.8489 47.3192 37.6996 47.9163 37.6996C48.2149 37.6996 48.5135 37.6996 48.8121 37.6996H48.9616H49.2601H49.4096H49.7082C50.3054 37.6996 51.0516 37.8489 51.6488 37.9982C52.9926 38.2968 54.1869 38.7447 55.3817 39.491C57.7703 40.8349 59.7113 42.9253 61.0551 45.314C61.6523 46.5083 62.1003 47.8521 62.3989 49.1959C62.3989 49.4945 62.548 49.9426 62.548 50.2412V50.5397V50.8383C62.548 50.9874 62.548 50.9874 62.548 51.1369C62.548 51.286 62.548 51.286 62.548 51.4355V51.7341V52.0327C62.548 52.1818 62.548 52.4803 62.548 52.6298C62.548 53.0779 62.548 53.3765 62.3989 53.8242C62.3989 54.1227 62.2494 54.5708 62.2494 54.8694C62.2494 55.168 62.1 55.616 61.9509 55.9146C61.8014 56.6609 61.5028 57.4075 61.2042 58.0047C60.607 59.3485 59.8608 60.6923 58.9647 62.0358C57.1732 64.4248 54.7845 66.5149 51.9478 67.7092C50.604 68.3068 49.111 68.7544 47.6177 69.053C46.8715 69.2025 46.1248 69.2025 45.3782 69.3516H45.2291H45.0796H44.781H44.4824H44.3333C43.8853 69.3516 43.5867 69.3516 43.1386 69.3516C41.4966 69.2025 39.8542 68.9039 38.3609 68.4559C36.868 68.0082 35.2257 67.4106 33.882 66.6644C31.0453 65.1711 28.5071 63.081 26.4169 60.5428C25.3718 59.3485 24.4759 58.0047 23.8787 56.5118C23.1322 55.0189 22.535 53.5256 22.0871 52.0327C21.6392 50.5397 21.3406 48.8973 21.3406 47.4044V47.1055V46.9564V46.6578V45.762V45.6126V45.314V45.1649C21.3406 45.0154 21.3406 44.7168 21.3406 44.5673C21.3406 43.8211 21.4899 42.9253 21.4899 42.1787C21.6392 41.432 21.7885 40.5363 21.9378 39.79C22.0871 39.0433 22.2364 38.1475 22.535 37.401C22.9829 35.908 23.5802 34.4149 24.1774 32.9219C25.5211 30.0852 27.1634 27.547 29.2536 25.6061C29.7015 25.1582 30.2988 24.561 30.896 24.1131C31.4932 23.6652 32.0904 23.2172 32.6876 22.9187C33.2848 22.4708 33.882 22.1721 34.4792 21.8735C34.7778 21.7242 35.0764 21.5749 35.375 21.4256C35.5243 21.4256 35.6736 21.2763 35.8229 21.2763C35.9722 21.2763 36.1215 21.127 36.2709 21.127C36.8681 20.8284 37.6146 20.6791 38.2118 20.3805C38.3609 20.3805 38.5104 20.2312 38.6599 20.2312C38.809 20.2312 38.9585 20.0819 39.1076 20.0819C39.4061 19.9326 39.8542 19.9326 40.1528 19.7833C40.3019 19.7833 40.4514 19.634 40.75 19.634C40.8991 19.634 41.0485 19.634 41.3471 19.4847C41.4966 19.4847 41.6457 19.4847 41.9443 19.3354H42.2429H42.5415C42.6909 19.3354 42.84 19.3354 43.1386 19.1861C43.2881 19.1861 43.5867 19.1861 43.7362 19.0368C43.8853 19.0368 44.1839 19.0368 44.3333 19.0368C44.4824 19.0368 44.6319 19.0368 44.781 19.0368H45.0796H45.2291H45.3782C45.5277 19.0368 45.8262 19.0368 45.9753 19.0368H46.2739H46.4234C46.5729 19.0368 46.722 19.0368 46.8715 19.0368C47.6177 19.0368 48.2149 19.0368 48.9616 19.0368C50.3054 19.0368 51.6488 19.1861 52.9926 19.4847C55.5308 19.9326 57.9198 20.8284 60.1594 21.8735C62.3989 22.9187 64.3395 24.2624 65.9819 25.7554C66.1314 25.9047 66.1314 25.9047 66.2805 26.054C66.43 26.2033 66.43 26.2033 66.5791 26.3526C66.7286 26.5019 67.0271 26.6512 67.1762 26.9498C67.3257 27.2484 67.6243 27.2484 67.7738 27.547C67.9229 27.8456 68.2215 27.995 68.371 28.1442C69.1172 28.8907 69.7144 29.6373 70.3119 30.5331C71.5063 32.0261 72.5515 33.6684 73.2978 35.1614C73.2978 35.3108 73.4473 35.3108 73.4473 35.4601C73.4473 35.6093 73.5964 35.6093 73.5964 35.7587C73.7458 35.908 73.7458 36.0573 73.8949 36.3559C74.0444 36.5052 74.0444 36.6545 74.1935 36.9531C74.343 37.1024 74.343 37.2517 74.4921 37.5503C74.7911 38.2968 75.0896 38.894 75.2387 39.491C75.5373 40.5363 75.8359 41.432 75.9854 42.1787C76.1345 42.4772 76.4331 42.7758 76.7317 42.6267C77.0302 42.6267 77.3292 42.3281 77.3292 42.0292C77.9264 40.2377 77.9264 39.1925 77.7769 38.1475Z"
            fill="currentColor"
          />
        </svg>

        <div className="flex flex-col md:flex-row gap-2 mt-1">
          <AlertTitle_Shadcn_ className="flex-grow">Advanced observability</AlertTitle_Shadcn_>
          <GrafanaBannerActions className="hidden xl:flex" />
        </div>
        <AlertDescription_Shadcn_ className="relative flex flex-col xl:flex-row gap-2 md:max-w-lg">
          <p className="flex-grow">
            Set up the Supabase Grafana Dashboard to visualize over 200 database performance and
            health metrics on your Supabase project.
          </p>
          <GrafanaBannerActions className="xl:hidden" />
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <section>
        <Panel title={<h2>Database health</h2>}>
          <Panel.Content>
            <div className="mb-4 flex items-center gap-x-2">
              <ButtonTooltip
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <div className="flex items-center gap-x-3">
                <DateRangePicker
                  loading={false}
                  value={'7d'}
                  options={TIME_PERIODS_INFRA}
                  currentBillingPeriodStart={undefined}
                  onChange={(values) => {
                    if (values.interval === '1d') {
                      setDateRange({ ...values, interval: '1h' })
                    } else {
                      setDateRange(values)
                    }
                  }}
                />
                {dateRange && (
                  <div className="flex items-center gap-x-2">
                    <p className="text-foreground-light">
                      {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                    </p>
                    <p className="text-foreground-light">
                      <ArrowRight size={12} />
                    </p>
                    <p className="text-foreground-light">
                      {dayjs(dateRange.period_end.date).format('MMMM D, hh:mma')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              {dateRange &&
                REPORT_ATTRIBUTES.map((attr) => (
                  <ChartHandler
                    key={attr.id}
                    provider="infra-monitoring"
                    attribute={attr.id}
                    label={attr.label}
                    interval={dateRange.interval}
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                  />
                ))}
            </div>
          </Panel.Content>
        </Panel>

        {dateRange && isReplicaSelected && (
          <Panel title="Replica Information">
            <Panel.Content>
              <div id="replication-lag">
                <ChartHandler
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  attribute="physical_replication_lag_physical_replica_lag_seconds"
                  label="Replication lag"
                  interval={dateRange.interval}
                  provider="infra-monitoring"
                />
              </div>
            </Panel.Content>
          </Panel>
        )}
      </section>
      <section id="database-size-report">
        <ReportWidget
          isLoading={isLoading}
          params={params.largeObjects}
          title="Database Size"
          data={data.largeObjects || []}
          queryType={'db'}
          resolvedSql={largeObjectsSql}
          renderer={(props) => {
            return (
              <div>
                <div className="col-span-4 inline-grid grid-cols-12 gap-12 w-full mt-5">
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Space used</h5>
                    <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Provisioned disk size</h5>
                    <span className="text-lg">{currentDiskSize} GB</span>
                  </div>

                  <div className="col-span-8 text-right">
                    {project?.cloud_provider === 'AWS' ? (
                      <Button asChild type="default">
                        <Link href={`/project/${ref}/settings/compute-and-disk`}>
                          Increase disk size
                        </Link>
                      </Button>
                    ) : (
                      <ButtonTooltip
                        type="default"
                        disabled={!canUpdateDiskSizeConfig}
                        onClick={() => setshowIncreaseDiskSizeModal(true)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canUpdateDiskSizeConfig
                              ? 'You need additional permissions to increase the disk size'
                              : undefined,
                          },
                        }}
                      >
                        Increase disk size
                      </ButtonTooltip>
                    )}
                  </div>
                </div>

                <h3 className="mt-8 text-sm">Large Objects</h3>
                {!props.isLoading && props.data.length === 0 && <span>No large objects found</span>}
                {!props.isLoading && props.data.length > 0 && (
                  <Table
                    className="space-y-3 mt-4"
                    head={[
                      <Table.th key="object" className="py-2">
                        Object
                      </Table.th>,
                      <Table.th key="size" className="py-2">
                        Size
                      </Table.th>,
                    ]}
                    body={props.data?.map((object) => {
                      const percentage = (
                        ((object.table_size as number) / databaseSizeBytes) *
                        100
                      ).toFixed(2)

                      return (
                        <Table.tr key={`${object.schema_name}.${object.relname}`}>
                          <Table.td>
                            {object.schema_name}.{object.relname}
                          </Table.td>
                          <Table.td>
                            {formatBytes(object.table_size)} ({percentage}%)
                          </Table.td>
                        </Table.tr>
                      )
                    })}
                  />
                )}
              </div>
            )
          }}
          append={() => (
            <div className="px-6 pb-2">
              <Alert_Shadcn_ variant="default" className="mt-4">
                <AlertDescription_Shadcn_>
                  <div className="space-y-2">
                    <p>
                      New Supabase projects have a database size of ~40-60mb. This space includes
                      pre-installed extensions, schemas, and default Postgres data. Additional
                      database size is used when installing extensions, even if those extensions are
                      inactive.
                    </p>

                    <Button asChild type="default" icon={<ExternalLink />}>
                      <Link
                        href="https://supabase.com/docs/guides/platform/database-size#disk-space-usage"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read about database size
                      </Link>
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
          )}
        />
        <DiskSizeConfigurationModal
          visible={showIncreaseDiskSizeModal}
          loading={isUpdatingDiskSize}
          hideModal={setshowIncreaseDiskSizeModal}
        />
      </section>
    </>
  )
}

const GrafanaBannerActions = ({ className }: { className?: string }) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className={cn('flex gap-2', className)}>
      <Button type="outline" size="tiny" icon={<BookOpen />} asChild>
        <Link
          href="https://supabase.com/docs/guides/telemetry/metrics"
          target="_blank"
          onClick={() =>
            sendEvent({
              action: TelemetryActions.STUDIO_REPORTS_DATABASE_GRAFANA_BANNER_CLICKED,
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Docs
        </Link>
      </Button>
      <Button type="default" size="tiny" asChild>
        <Link
          href="https://github.com/supabase/supabase-grafana"
          target="_blank"
          onClick={() =>
            sendEvent({
              action: TelemetryActions.STUDIO_REPORTS_DATABASE_GRAFANA_BANNER_CLICKED,
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Configure Grafana
        </Link>
      </Button>
    </div>
  )
}
