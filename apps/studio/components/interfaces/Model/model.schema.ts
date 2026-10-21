import { z } from 'zod'

import type { InfraMonitoringAttribute } from '@/data/analytics/infra-monitoring-query'

export const MODEL_METRICS = {
  connections: {
    label: 'Database connections',
    attribute: 'pg_stat_database_num_backends',
    unit: 'connections',
  },
  cpu: { label: 'CPU usage', attribute: 'avg_cpu_usage', unit: '%' },
  memory: { label: 'Memory usage', attribute: 'ram_usage', unit: '%' },
} satisfies Record<string, { label: string; attribute: InfraMonitoringAttribute; unit: string }>

export const MODEL_LIMITS = { encodedCharacters: 16_384, decompressedBytes: 65_536 }

const timestamp = z.string().datetime()
const intervalMinutes = { '1m': 1, '5m': 5, '10m': 10, '30m': 30, '1h': 60, '1d': 1440 }

export const modelSchema = z
  .object({
    version: z.literal(1),
    title: z.string().trim().min(1).max(120),
    start: timestamp,
    end: timestamp,
    interval: z.enum(['1m', '5m', '10m', '30m', '1h', '1d']),
    panels: z
      .array(
        z
          .object({
            metric: z.enum(['connections', 'cpu', 'memory']),
            title: z.string().trim().min(1).max(120).optional(),
            description: z.string().trim().max(1000).optional(),
          })
          .strict()
      )
      .min(1)
      .max(8),
    annotations: z
      .array(
        z
          .object({
            at: timestamp,
            label: z.string().trim().min(1).max(160),
          })
          .strict()
      )
      .max(20)
      .default([]),
  })
  .strict()
  .superRefine((model, ctx) => {
    const start = Date.parse(model.start)
    const end = Date.parse(model.end)
    const duration = end - start
    if (duration <= 0 || duration > 7 * 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a time range greater than zero and no longer than 7 days.',
        path: ['end'],
      })
    }
    if (duration / (intervalMinutes[model.interval] * 60 * 1000) > 1440) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose an interval with no more than 1,440 time buckets.',
        path: ['interval'],
      })
    }
    if (model.annotations.some(({ at }) => Date.parse(at) < start || Date.parse(at) > end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Annotations must fall within the time range.',
        path: ['annotations'],
      })
    }
  })

export type DashboardModel = z.infer<typeof modelSchema>

export function createExampleModel(now = new Date()): DashboardModel {
  const end = new Date(Math.floor(now.getTime() / 60_000) * 60_000)
  return {
    version: 1,
    title: 'Database health',
    start: new Date(end.getTime() - 60 * 60_000).toISOString(),
    end: end.toISOString(),
    interval: '1m',
    panels: [{ metric: 'connections' }, { metric: 'cpu' }, { metric: 'memory' }],
    annotations: [
      {
        at: new Date(end.getTime() - 30 * 60_000).toISOString(),
        label: 'Illustrative annotation (not a detected event)',
      },
    ],
  }
}
