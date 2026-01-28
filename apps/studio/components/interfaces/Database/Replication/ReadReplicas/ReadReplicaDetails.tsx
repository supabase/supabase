import { BarChart2 } from 'lucide-react'
import { useMemo } from 'react'

import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { useReplicationLagQuery } from '@/data/read-replicas/replica-lag-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReadReplicasStatusesQuery } from '@/data/read-replicas/replicas-status-query'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { BASE_PATH } from '@/lib/constants'
import { useFlag, useParams } from 'common'
import { AWS_REGIONS } from 'shared-data'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
  GenericSkeletonLoader,
} from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const attribute = 'physical_replication_lag_physical_replication_lag_seconds'

export const ReadReplicaDetails = () => {
  const { ref: projectRef, replicaId } = useParams()
  const reportGranularityV2 = useFlag('reportGranularityV2')

  const { data = [], isPending: isLoadingDatabases } = useReadReplicasQuery({ projectRef })
  const replica = data.find((x) => x.identifier === replicaId)
  const { identifier, connectionString, status: baseStatus, restUrl, region, size } = replica ?? {}
  const regionLabel = Object.values(AWS_REGIONS).find((x) => x.code === region)?.displayName

  const { data: statuses = [] } = useReadReplicasStatusesQuery({ projectRef })
  const replicaStatus = statuses.find((x) => x.identifier === identifier)
  const status = replicaStatus?.status ?? baseStatus

  const { data: loadBalancers = [] } = useLoadBalancersQuery({ projectRef })
  const loadBalancer = loadBalancers.find((x) =>
    x.databases.some((x) => x.identifier === identifier)
  )

  const { data: lagDuration, isPending: isLoadingLag } = useReplicationLagQuery(
    {
      id: identifier ?? '',
      projectRef,
      connectionString,
    },
    { enabled: status === REPLICA_STATUS.ACTIVE_HEALTHY }
  )

  const { selectedDateRange } = useReportDateRange(
    REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES,
    reportGranularityV2
  )
  // [Joshen] This is unused but intentional to scaffold the usage for now, refer to comment below
  const { data: infraMonitoringData, isPending: isFetchingInfraMonitoring } =
    useInfraMonitoringAttributesQuery(
      {
        projectRef,
        attributes: [attribute],
        databaseIdentifier: identifier,
        startDate: selectedDateRange.period_start.date,
        endDate: selectedDateRange.period_end.date,
        interval: selectedDateRange.interval,
      },
      { enabled: !!replica }
    )

  const chartData = useMemo(
    () =>
      infraMonitoringData?.data.map((x) => ({
        timestamp: x.period_start,
        [attribute]: (x as Record<string, string | number>)[attribute],
      })) ?? [],
    [infraMonitoringData?.data]
  )

  return (
    <>
      <Chart className="mt-6" isLoading={isLoadingLag || isFetchingInfraMonitoring}>
        <ChartCard className="rounded-none border-x-0">
          <ChartHeader className="px-10">
            <ChartMetric
              label="Replication lag"
              value={lagDuration !== undefined ? `${lagDuration}s` : '-'}
            />
          </ChartHeader>
          <ChartContent
            isEmpty={chartData.length === 0}
            emptyState={
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="No data to show"
                description="It may take up to 24 hours for data to refresh"
              />
            }
            loadingState={<ChartLoadingState className="h-[228px]" />}
          >
            <div className="h-56 px-5">
              <ChartLine
                showGrid
                showYAxis
                isFullHeight
                data={chartData}
                dataKey={attribute}
                YAxisProps={{
                  tickFormatter: (value) => `${value}s`,
                  width: 80,
                }}
                config={{
                  [attribute]: { label: 'Replication lag' },
                }}
              />
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
      <ScaffoldContainer>
        <ScaffoldSection isFullWidth>
          <Card>
            <CardHeader>
              <CardTitle>Replica Information</CardTitle>
            </CardHeader>
            {isLoadingDatabases ? (
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            ) : (
              <>
                <CardContent>
                  <FormItemLayout
                    isReactForm={false}
                    layout="horizontal"
                    label="Load Balancer URL"
                    description="RESTful endpoint for querying and managing your databases through your load balancer"
                  >
                    <Input readOnly copy className="input-mono" value={loadBalancer?.endpoint} />
                  </FormItemLayout>
                </CardContent>
                <CardContent className="flex flex-col gap-y-4">
                  <FormItemLayout isReactForm={false} layout="horizontal" label="Replica URL">
                    <Input readOnly copy className="input-mono" value={restUrl} />
                  </FormItemLayout>
                  <FormItemLayout isReactForm={false} layout="horizontal" label="Region">
                    <Input
                      readOnly
                      className="input-mono"
                      value={regionLabel}
                      icon={
                        <img
                          alt="region icon"
                          className="w-5 rounded-sm"
                          src={`${BASE_PATH}/img/regions/${region ?? ''}.svg`}
                        />
                      }
                    />
                  </FormItemLayout>
                  <FormItemLayout
                    isReactForm={false}
                    layout="horizontal"
                    label="Compute Size"
                    description="Size of replica will be identical to the primary database"
                  >
                    <Input readOnly className="input-mono" value={size} />
                  </FormItemLayout>
                </CardContent>
              </>
            )}
          </Card>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
