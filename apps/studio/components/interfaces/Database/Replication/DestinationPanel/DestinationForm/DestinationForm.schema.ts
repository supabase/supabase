import * as z from 'zod'

import { AnalyticsBucketFormSchema } from './AnalyticsBucket/AnalyticsBucket.schema'
import { BigQueryFormSchema } from './BigQuery/BigQuery.schema'
import { ClickHouseFormSchema } from './ClickHouse/ClickHouse.schema'
import { DuckLakeFormSchema } from './DuckLake/DuckLake.schema'
import { SnowflakeFormSchema } from './Snowflake/Snowflake.schema'
import { requiredNumberInputSchema } from '@/lib/forms/zod-number-input'

const BATCH_WAIT_TIME_MIN_ERROR = 'Batch wait time must be 0 or greater.'
const MAX_TABLE_SYNC_WORKERS_MIN_ERROR = 'Max table sync workers must be greater than 0.'
const MAX_COPY_CONNECTIONS_MIN_ERROR = 'Max copy connections per table must be greater than 0.'

const CommonFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  publicationName: z.string().min(1, 'Publication is required.'),
  tableSyncCopyMode: z.enum([
    'include_all_tables',
    'skip_all_tables',
    'include_tables',
    'skip_tables',
  ]),
  tableSyncCopyTableIds: z.array(z.string()),
  maxFillMs: requiredNumberInputSchema(
    z
      .number({
        required_error: BATCH_WAIT_TIME_MIN_ERROR,
        invalid_type_error: BATCH_WAIT_TIME_MIN_ERROR,
      })
      .int('Batch wait time must be a whole number of milliseconds.')
      .min(0, BATCH_WAIT_TIME_MIN_ERROR)
  ),
  maxTableSyncWorkers: requiredNumberInputSchema(
    z
      .number({
        required_error: MAX_TABLE_SYNC_WORKERS_MIN_ERROR,
        invalid_type_error: MAX_TABLE_SYNC_WORKERS_MIN_ERROR,
      })
      .min(1, MAX_TABLE_SYNC_WORKERS_MIN_ERROR)
      .int('Max table sync workers must be a whole number.')
  ),
  maxCopyConnectionsPerTable: requiredNumberInputSchema(
    z
      .number({
        required_error: MAX_COPY_CONNECTIONS_MIN_ERROR,
        invalid_type_error: MAX_COPY_CONNECTIONS_MIN_ERROR,
      })
      .int()
      .min(1, MAX_COPY_CONNECTIONS_MIN_ERROR)
  ),
  invalidatedSlotBehavior: z.enum(['error', 'recreate']).optional(),
})

export const DestinationPanelFormSchema = CommonFormSchema.extend(BigQueryFormSchema.shape)
  .extend(AnalyticsBucketFormSchema.shape)
  .extend(DuckLakeFormSchema.shape)
  .extend(SnowflakeFormSchema.shape)
  .extend(ClickHouseFormSchema.shape)

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
