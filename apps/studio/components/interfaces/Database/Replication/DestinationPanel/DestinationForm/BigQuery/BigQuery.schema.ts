import * as z from 'zod'

import {
  BIGQUERY_MAX_CLUSTERING_COLUMNS,
  BIGQUERY_TIME_PARTITION_GRANULARITIES,
} from '@/data/replication/create-destination-pipeline-mutation'

const BigQueryTimePartitionGranularitySchema = z.enum(BIGQUERY_TIME_PARTITION_GRANULARITIES)

const integerRangeValue = (label: string) =>
  z
    .union([
      z.literal(''),
      z.number().int(`${label} must be a whole number`).safe(`${label} must be a safe integer`),
    ])
    .refine((value) => value !== '', `${label} is required`)

export const BigQueryPartitionBySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('time_column'),
    column: z.string(),
    granularity: BigQueryTimePartitionGranularitySchema.optional(),
  }),
  z.object({
    kind: z.literal('integer_range'),
    column: z.string(),
    start: integerRangeValue('Start'),
    end: integerRangeValue('End'),
    interval: integerRangeValue('Interval'),
  }),
  z.object({
    kind: z.literal('ingestion_time'),
    granularity: BigQueryTimePartitionGranularitySchema.optional(),
  }),
])

export const BigQueryTableOptionSchema = z
  .object({
    tableId: z.number().int().nonnegative().max(4_294_967_295),
    partitionBy: BigQueryPartitionBySchema.optional(),
    clusterBy: z
      .array(z.string())
      .max(
        BIGQUERY_MAX_CLUSTERING_COLUMNS,
        `Select up to ${BIGQUERY_MAX_CLUSTERING_COLUMNS} clustering columns`
      )
      .optional(),
  })
  .superRefine((option, ctx) => {
    if (option.partitionBy?.kind !== 'integer_range') return
    if (option.partitionBy.column.trim().length === 0) return

    const { start, end, interval } = option.partitionBy
    if (typeof start !== 'number' || typeof end !== 'number' || typeof interval !== 'number') {
      return
    }

    if (start >= end) {
      ctx.addIssue({
        code: 'custom',
        path: ['partitionBy', 'end'],
        message: 'End must be greater than start.',
      })
    }

    if (interval <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['partitionBy', 'interval'],
        message: 'Interval must be greater than 0.',
      })
    }
  })

export const BigQueryFormSchema = z.object({
  projectId: z.string().optional(),
  datasetId: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  connectionPoolSize: z
    .number()
    .int()
    .min(1, 'Connection pool size must be greater than 0.')
    .optional(),
  maxStalenessMins: z
    .number()
    .int('Maximum staleness must be a whole number of minutes.')
    .min(0, 'Maximum staleness must be 0 or greater.')
    .optional(),
  tableOptions: z.array(BigQueryTableOptionSchema).optional(),
})
