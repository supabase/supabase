import * as z from 'zod'

const BigQueryTimePartitionGranularitySchema = z.enum(['hour', 'day', 'month', 'year'])

export const BigQueryPartitionBySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('time_column'),
    column: z.string().min(1, 'Column is required'),
    granularity: BigQueryTimePartitionGranularitySchema.optional(),
  }),
  z.object({
    kind: z.literal('integer_range'),
    column: z.string().min(1, 'Column is required'),
    start: z.number().int('Start must be a whole number').safe('Start must be a safe integer'),
    end: z.number().int('End must be a whole number').safe('End must be a safe integer'),
    interval: z
      .number()
      .int('Interval must be a whole number')
      .safe('Interval must be a safe integer'),
  }),
  z.object({
    kind: z.literal('ingestion_time'),
    granularity: BigQueryTimePartitionGranularitySchema.optional(),
  }),
])

export const BigQueryTableOptionSchema = z.object({
  tableId: z.number().int().nonnegative().max(4_294_967_295),
  partitionBy: BigQueryPartitionBySchema.optional(),
  clusterBy: z.array(z.string()).optional(),
})

export const BigQueryFormSchema = z.object({
  projectId: z.string().optional(),
  datasetId: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  connectionPoolSize: z
    .number()
    .int()
    .min(1, 'Connection pool size must be greater than 0')
    .optional(),
  maxStalenessMins: z
    .number()
    .int('Maximum staleness must be a whole number of minutes')
    .min(0, 'Maximum staleness must be 0 or greater')
    .optional(),
  tableOptions: z.array(BigQueryTableOptionSchema).optional(),
})
