import { useMemo } from 'react'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ScaffoldSectionTitle, ScaffoldSection } from 'components/layouts/Scaffold'
import { Card, Skeleton } from 'ui'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'

const MonitoringMetric = ({
  title,
  value,
  isLoading,
}: {
  title: string
  value: string
  isLoading: boolean
}) => {
  return (
    <div className="flex items-baseline gap-2 text-sm text-foreground-light">
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <>
          <span>{title}</span>
          <span className="text-foreground">{value}</span>
        </>
      )}
    </div>
  )
}

export const OverviewMonitoring = () => {
  const { ref: projectRef } = useParams()

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-4">
        <ScaffoldSectionTitle>Monitoring</ScaffoldSectionTitle>
        <div className="flex items-center gap-2">
          <MonitoringMetric title="Memory Usage" value="0" isLoading={false} />
          <span className="text-foreground-muted">/</span>
          <MonitoringMetric title="CPU Usage" value="0" isLoading={false} />
          <span className="text-foreground-muted">/</span>
          <MonitoringMetric title="Disk IO" value="0" isLoading={false} />
          <span className="text-foreground-muted">/</span>
          <MonitoringMetric title="Disk Usage" value="0" isLoading={false} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="h-36" />
        <Card className="h-36" />
        <Card className="aspect-video" />
        <Card className="aspect-video" />
        <Card className="aspect-video" />
        <Card className="aspect-video" />
      </div>
    </ScaffoldSection>
  )
}
