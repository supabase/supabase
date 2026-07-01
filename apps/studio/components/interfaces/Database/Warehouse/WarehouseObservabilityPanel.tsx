import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Chart, ChartContent, ChartLine, ChartMetric } from 'ui-patterns/Chart'
import { useSnapshot } from 'valtio'

import {
  formatReplicationPhase,
  useProjectReplication,
  warehouseDemoStore,
  type CopyStatus,
  type PipelineStatus,
  type ReplicationPhase,
  type WarehouseProjectReplicationStatus,
} from './warehouseDemoStore'
import {
  buildReplicationLogsUrl,
  buildWarehouseLagSparklineData,
  WAREHOUSE_LAG_CHART_CONFIG,
} from './warehouseObservability.utils'
import {
  getReplicationLagDisplay,
  REPLICATION_LAG_BEHIND_THRESHOLD_BYTES,
} from './warehouseReplication.utils'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { formatBytes } from '@/lib/helpers'

const DATE_TIME_FORMAT = 'MMM D'

function pipelineStatusToCopyStatus(status: PipelineStatus): CopyStatus {
  return status === 'live' ? 'live' : 'error'
}

function PhaseMetric({ phase }: { phase: ReplicationPhase }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
      <ChartMetric
        label="Replication phase"
        value={formatReplicationPhase(phase)}
        tooltip="Project-wide Warehouse pipeline phase. Initial sync runs once per project; streaming is steady-state replication."
        className="[&_span]:text-sm"
      />
      <div className="flex h-12 items-center">
        <WarehouseSyncChip
          copyStatus={
            phase === 'error' ? 'error' : phase === 'initial_sync' ? 'backfilling' : 'live'
          }
        />
      </div>
    </div>
  )
}

function LinkedTablesMetric({ count }: { count: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
      <ChartMetric
        label="Linked tables"
        value={count.toLocaleString()}
        tooltip="Postgres tables with an active Warehouse copy in this project."
        className="[&_span]:text-sm"
      />
    </div>
  )
}

function PipelineStatusMetric({ status }: { status: PipelineStatus }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
      <ChartMetric
        label="Pipeline status"
        value={status === 'live' ? 'Live' : 'Error'}
        tooltip="Overall health of this project’s Warehouse replication pipeline."
        className="[&_span]:text-sm"
      />
      <div className="flex h-12 items-center">
        <WarehouseSyncChip copyStatus={pipelineStatusToCopyStatus(status)} />
      </div>
    </div>
  )
}

function LagMetric({ replication }: { replication: WarehouseProjectReplicationStatus }) {
  const lagDisplay = getReplicationLagDisplay(replication)
  const showSparkline = lagDisplay.health === 'behind' || lagDisplay.health === 'critical'
  const chartData = useMemo(
    () => buildWarehouseLagSparklineData({ currentLagBytes: replication.replicationLagBytes }),
    [replication.replicationLagBytes]
  )

  const value =
    lagDisplay.lagAmount !== undefined
      ? `${lagDisplay.headline} · ${lagDisplay.lagAmount}`
      : lagDisplay.headline

  const valueClassName =
    lagDisplay.tone === 'destructive'
      ? 'text-destructive'
      : lagDisplay.tone === 'warning'
        ? 'text-warning'
        : undefined

  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
      <ChartMetric
        label="Replication lag"
        value={value}
        tooltip={lagDisplay.tooltip}
        className={valueClassName ? `[&_span]:text-sm ${valueClassName}` : '[&_span]:text-sm'}
      />
      {showSparkline ? (
        <div className="h-12">
          <Chart>
            <ChartContent isEmpty={chartData.length === 0}>
              <ChartLine
                data={chartData}
                dataKey="lag_bytes"
                config={WAREHOUSE_LAG_CHART_CONFIG}
                DateTimeFormat={DATE_TIME_FORMAT}
                className="h-12 gap-0"
                isFullHeight
                showYAxis={false}
                showGrid={false}
                YAxisProps={{
                  tickFormatter: (value) => formatBytes(Number(value), 0),
                }}
              />
            </ChartContent>
          </Chart>
        </div>
      ) : (
        <div className="flex h-12 items-center text-xs text-foreground-lighter">
          {replication.replicationLagBytes < REPLICATION_LAG_BEHIND_THRESHOLD_BYTES
            ? 'No backlog above threshold'
            : null}
        </div>
      )}
    </div>
  )
}

export function WarehouseObservabilityPanel() {
  const { ref: projectRef } = useParams()
  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const projectReplication = useProjectReplication()
  const linkedTableCount = useMemo(
    () =>
      Object.values(warehouseSnap.tables).filter((table) => table.mode === 'has_warehouse_copy')
        .length,
    [warehouseSnap.tables]
  )
  const replicationLogsUrl =
    projectRef !== undefined ? buildReplicationLogsUrl(projectRef) : undefined
  const tablesUrl = projectRef !== undefined ? `/project/${projectRef}/database/tables` : undefined

  if (linkedTableCount === 0 || !projectReplication) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-md border bg-surface-75 px-6 py-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">No Warehouse copies yet</h3>
          <p className="max-w-md text-sm text-foreground-light">
            Copy a table to Warehouse to see project-wide replication metrics here. Lag and pipeline
            phase are shared across all Warehouse tables.
          </p>
        </div>
        {tablesUrl && (
          <Button variant="default" asChild>
            <Link href={tablesUrl}>Go to Tables</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-foreground-light">
        Project-wide Warehouse replication health. Metrics below are mock data in this prototype.
      </p>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-y-0">
            <LagMetric replication={projectReplication} />
            <PhaseMetric phase={projectReplication.replicationPhase} />
            <LinkedTablesMetric count={linkedTableCount} />
            <PipelineStatusMetric status={projectReplication.pipelineStatus} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {replicationLogsUrl && (
          <Button variant="default" asChild>
            <Link href={replicationLogsUrl}>View replication logs</Link>
          </Button>
        )}
        {tablesUrl && (
          <Button variant="text" asChild>
            <Link href={tablesUrl}>Manage table copies</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
