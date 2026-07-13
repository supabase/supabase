import * as z from 'zod'

import { AnalyticsBucketFormSchema } from './AnalyticsBucket/AnalyticsBucket.schema'
import { BigQueryFormSchema } from './BigQuery/BigQuery.schema'
import { ClickHouseFormSchema } from './ClickHouse/ClickHouse.schema'
import { DuckLakeFormSchema } from './DuckLake/DuckLake.schema'
import { SnowflakeFormSchema } from './Snowflake/Snowflake.schema'

const CommonFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  publicationName: z.string().min(1, 'Publication is required'),
  maxFillMs: z.number().min(1, 'Max Fill milliseconds should be greater than 0').int().optional(),
  maxTableSyncWorkers: z
    .number()
    .min(1, 'Max table sync workers should be greater than 0')
    .int()
    .optional(),
  maxCopyConnectionsPerTable: z
    .number()
    .int()
    .min(1, 'Max copy connections per table should be greater than 0')
    .optional(),
  invalidatedSlotBehavior: z.enum(['error', 'recreate']).optional(),
})

export const DestinationPanelFormSchema = CommonFormSchema.extend(BigQueryFormSchema.shape)
  .extend(AnalyticsBucketFormSchema.shape)
  .extend(DuckLakeFormSchema.shape)
  .extend(SnowflakeFormSchema.shape)
  .extend(ClickHouseFormSchema.shape)

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
