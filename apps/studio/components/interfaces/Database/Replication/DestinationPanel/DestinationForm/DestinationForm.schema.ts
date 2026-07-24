import * as z from 'zod'

import { AnalyticsBucketFormSchema } from './AnalyticsBucket/AnalyticsBucket.schema'
import { BigQueryFormSchema } from './BigQuery/BigQuery.schema'
import { ClickHouseFormSchema } from './ClickHouse/ClickHouse.schema'
import { DuckLakeFormSchema } from './DuckLake/DuckLake.schema'
import { SnowflakeFormSchema } from './Snowflake/Snowflake.schema'

const CommonFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  publicationName: z.string().min(1, 'Publication is required'),
  tableSyncCopyMode: z.enum([
    'include_all_tables',
    'skip_all_tables',
    'include_tables',
    'skip_tables',
  ]),
  tableSyncCopyTableIds: z.array(z.string()),
  maxFillMs: z
    .number()
    .int('Batch wait time must be a whole number of milliseconds')
    .min(0, 'Batch wait time must be 0 or greater')
    .optional(),
  maxTableSyncWorkers: z
    .number()
    .min(1, 'Max table sync workers must be greater than 0')
    .int('Max table sync workers must be a whole number')
    .optional(),
  maxCopyConnectionsPerTable: z
    .number()
    .int()
    .min(1, 'Max copy connections per table must be greater than 0')
    .optional(),
  invalidatedSlotBehavior: z.enum(['error', 'recreate']).optional(),
})

export const DestinationPanelFormSchema = CommonFormSchema.extend(BigQueryFormSchema.shape)
  .extend(AnalyticsBucketFormSchema.shape)
  .extend(DuckLakeFormSchema.shape)
  .extend(SnowflakeFormSchema.shape)
  .extend(ClickHouseFormSchema.shape)

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
