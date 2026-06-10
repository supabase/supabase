'use client'

import throughputTable from '~/data/realtime/throughput.json'
import { lazy, Suspense } from 'react'

const Estimator = lazy(() => import('./RealtimeLimitsEstimator'))

export function RealtimeLimitsEstimator() {
  return (
    <Suspense>
      <Estimator />
    </Suspense>
  )
}

RealtimeLimitsEstimator.__markdown__ = [...new Set(throughputTable.map((l) => l.computeAddOn))]
  .map((computeAddOn) => {
    const label =
      computeAddOn === 'micro'
        ? 'Micro'
        : computeAddOn === 'small'
          ? 'Small to medium'
          : 'Large to 16XL'
    const rows = throughputTable
      .filter((l) => l.computeAddOn === computeAddOn)
      .map(
        (l) =>
          `| ${l.filters ? '✅' : '🚫'} | ${l.rls ? '✅' : '🚫'} | ${Intl.NumberFormat().format(l.concurrency)} | ${l.maxDBChanges} | ${l.maxMessagesPerClient} | ${Intl.NumberFormat().format(l.totalMessagesPerSecond)} | ${l.p95Latency}ms |`
      )
      .join('\n')
    return `#### ${label}

| Filters | RLS | Connected clients | Total DB changes /sec | Max messages per client /sec | Max total messages /sec | Latency p95 |
| --- | --- | --- | --- | --- | --- | --- |
${rows}`
  })
  .join('\n\n')
