import dayjs from 'dayjs'
import { RotateCw } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { WORKER_ERROR_REASON_LABEL } from '../Workers.constants'
import type { Worker } from '../Workers.types'
import { WorkerMetricCard } from './WorkerMetricCard'
import { getWorkerMetrics, redeployWorker } from '@/state/workers-mock-state'

interface WorkerOverviewTabProps {
  projectRef: string
  worker: Worker
}

const formatCount = (value: number) => value.toLocaleString('en-US')
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`

export const WorkerOverviewTab = ({ projectRef, worker }: WorkerOverviewTabProps) => {
  const metrics = getWorkerMetrics(worker)
  const isErrored = worker.state === 'errored'
  const errorRateIntent =
    metrics.errorRate >= 0.05 ? 'destructive' : metrics.errorRate > 0.01 ? 'warning' : 'default'

  const recentEvents = [...worker.events].reverse().slice(0, 6)

  return (
    <div className="space-y-6">
      {isErrored && (
        <Admonition
          type="destructive"
          title="This worker errored"
          description={
            <div className="space-y-3">
              <p>
                {worker.errorReason
                  ? WORKER_ERROR_REASON_LABEL[worker.errorReason]
                  : 'The worker stopped unexpectedly.'}
              </p>
              <Button
                variant="default"
                size="tiny"
                icon={<RotateCw size={14} />}
                onClick={() => redeployWorker(projectRef, worker.id)}
              >
                Redeploy
              </Button>
            </div>
          }
        />
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm text-foreground">Last 24 hours</h3>
          <span className="text-xs text-foreground-lighter">Updated just now</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <WorkerMetricCard label="Requests" value={formatCount(metrics.requests24h)} />
          <WorkerMetricCard
            label="Errors"
            value={formatCount(metrics.errors24h)}
            intent={metrics.errors24h > 0 ? 'warning' : 'default'}
          />
          <WorkerMetricCard
            label="Error rate"
            value={formatPercent(metrics.errorRate)}
            intent={errorRateIntent}
          />
          <WorkerMetricCard
            label="Avg latency"
            value={`${metrics.avgLatencyMs} ms`}
            sublabel={`p99 ${metrics.p99LatencyMs} ms`}
          />
          <WorkerMetricCard label="CPU" value={`${metrics.cpuPercent}%`} sublabel="of allocation" />
          <WorkerMetricCard
            label="Memory"
            value={`${metrics.memoryPercent}%`}
            sublabel="of allocation"
          />
          <WorkerMetricCard label="Instances" value={formatCount(worker.instances)} />
          <WorkerMetricCard
            label="p99 latency"
            value={`${metrics.p99LatencyMs} ms`}
            sublabel="tail latency"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm text-foreground">Recent activity</h3>
        <div className="overflow-hidden rounded-md border border-default">
          {recentEvents.map((event, index) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 px-4 py-2.5 ${
                index % 2 === 0 ? 'bg-surface-100' : 'bg-surface-75'
              }`}
            >
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  event.level === 'error' ? 'bg-destructive' : 'bg-brand'
                }`}
              />
              <span className="flex-1 text-sm text-foreground-light">{event.message}</span>
              <span className="whitespace-nowrap font-mono text-xs text-foreground-lighter">
                {dayjs(event.at).format('HH:mm:ss')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
