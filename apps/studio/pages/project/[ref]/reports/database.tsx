import { useEffect, useState } from 'react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { useParams } from 'common'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ChartHandler from 'components/ui/Charts/ChartHandler'
import Panel from 'components/ui/Panel'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import ComposedChartHandler from 'components/ui/Charts/ComposedChartHandler'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import GrafanaPromoBanner from 'components/ui/GrafanaPromoBanner'

import { analyticsKeys } from 'data/analytics/keys'
import { getReportAttributes, getReportAttributesV2 } from 'data/reports/database-charts'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useFlag } from 'hooks/ui/useFlag'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { formatBytes } from 'lib/helpers'

import type { NextPageWithLayout } from 'types'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'

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

export type UpdateDateRange = (from: string, to: string) => void
export default DatabaseReport

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { project } = useProjectContext()
  const isReportsV2 = useFlag('reportsDatabaseV2')
  const org = useSelectedOrganization()
  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'
  const isTeamsOrEnterprisePlan =
    !isOrgPlanLoading && (orgPlan?.id === 'team' || orgPlan?.id === 'enterprise')
  const showChartsV2 = isReportsV2 || isTeamsOrEnterprisePlan

  const state = useDatabaseSelectorStateSnapshot()
  const defaultStart = dayjs().subtract(1, 'day').toISOString()
  const defaultEnd = dayjs().toISOString()
  const [dateRange, setDateRange] = useState<any>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  const queryClient = useQueryClient()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const report = useDatabaseReport()
  const { data, params, largeObjectsSql, isLoading, refresh } = report

  const { data: databaseSizeData } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString || undefined,
  })
  const databaseSizeBytes = databaseSizeData ?? 0
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const [showIncreaseDiskSizeModal, setshowIncreaseDiskSizeModal] = useState(false)
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const REPORT_ATTRIBUTES = getReportAttributes(isFreePlan)
  const REPORT_ATTRIBUTES_V2 = getReportAttributesV2(org!, project!)

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
          attribute: attr?.id,
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    })
    if (showChartsV2) {
      REPORT_ATTRIBUTES_V2.forEach((chart: any) => {
        chart.attributes.forEach((attr: any) => {
          queryClient.invalidateQueries(
            analyticsKeys.infraMonitoring(ref, {
              attribute: attr.attribute,
              startDate: period_start.date,
              endDate: period_start.end,
              interval,
              databaseIdentifier: state.selectedDatabaseId,
            })
          )
        })
      })
    }
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

  const handleIntervalGranularity = (from: string, to: string) => {
    const conditions = {
      '1m': dayjs(to).diff(from, 'hour') < 3, // less than 3 hours
      '10m': dayjs(to).diff(from, 'hour') < 6, // less than 6 hours
      '30m': dayjs(to).diff(from, 'hour') < 18, // less than 18 hours
      '1h': dayjs(to).diff(from, 'day') < 10, // less than 10 days
      '1d': dayjs(to).diff(from, 'day') >= 10, // more than 10 days
    }

    switch (true) {
      case conditions['1m']:
        return '1m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    setDateRange({
      period_start: { date: from, time_period: '1d' },
      period_end: { date: to, time_period: 'today' },
      interval: handleIntervalGranularity(from, to),
    })
  }

  return (
    <>
      <ReportHeader showDatabaseSelector title="Database" />
      <div className="w-full flex flex-col gap-1">
        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
        </div>
      </div>
      <GrafanaPromoBanner />
      <section className="relative pt-16 -mt-2">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 bg-200 py-4 mb-4 flex items-center space-x-3 pointer-events-auto">
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <div className="flex items-center gap-3">
              <DateRangePicker
                loading={false}
                value={'1d'}
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
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {showChartsV2 ? (
          <div className="grid grid-cols-1 gap-4">
            {dateRange &&
              REPORT_ATTRIBUTES_V2.filter((chart) => !chart.hide).map((chart) => (
                <ComposedChartHandler
                  key={chart.id}
                  {...chart}
                  attributes={chart.attributes as MultiAttribute[]}
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  updateDateRange={updateDateRange}
                  defaultChartStyle={chart.defaultChartStyle as 'line' | 'bar' | 'stackedAreaLine'}
                  showMaxValue={
                    chart.id === 'client-connections' || chart.id === 'pgbouncer-connections'
                      ? true
                      : chart.showMaxValue
                  }
                />
              ))}
          </div>
        ) : (
          <Panel title={<h2>Database health</h2>}>
            <Panel.Content className="grid grid-cols-1 gap-4">
              {dateRange &&
                REPORT_ATTRIBUTES.filter((attr) => !attr.hide).map((attr) => (
                  <ChartHandler
                    key={attr.id}
                    {...attr}
                    provider="infra-monitoring"
                    attribute={attr.id}
                    label={attr.label}
                    interval={dateRange.interval}
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                  />
                ))}
            </Panel.Content>
          </Panel>
        )}
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
                  <div className="grid gap-2 col-span-4 xl:col-span-2">
                    <h5 className="text-sm">Space used</h5>
                    <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
                  </div>
                  <div className="grid gap-2 col-span-4 xl:col-span-3">
                    <h5 className="text-sm">Provisioned disk size</h5>
                    <span className="text-lg">{currentDiskSize} GB</span>
                  </div>

                  <div className="col-span-full lg:col-span-4 xl:col-span-7 lg:text-right">
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
            <div className="px-6 pb-6">
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
