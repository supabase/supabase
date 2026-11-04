import type {
  BigQueryPartitionBy,
  BigQueryTableOption,
  CompleteBigQueryPartitionBy,
  CreatePipelineApiConfig,
  DucklakeDestinationConfig,
  DucklakeSupabaseDestinationConfig,
  PipelineConfig,
} from './types'
import { MAX_RETRY_FAILURE_COUNT } from '@/data/query-client'
import type { StudioError } from '@/lib/errors/studio-errors'
import { isStudioError } from '@/lib/errors/studio-errors'

const isLocal =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' &&
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging'

export const checkLocalPipelinesNotSetUp = (error: StudioError | null) => {
  if (error === null) return false

  const isPipelinesApiNotRunning =
    error.code === undefined && error.message.includes('API error happened')
  const isPipelinesNotSetUp =
    error.code === 503 && error.message.includes('replication API URL is not configured')
  return isLocal && (isPipelinesApiNotRunning || isPipelinesNotSetUp)
}

export const checkReplicationFeatureFlagRetry = (
  failureCount: number,
  error: StudioError
): boolean => {
  const isFeatureFlagRequiredError =
    isStudioError(error) && error.code === 503 && error.message.includes('feature flag is required')

  const isLocalPipelinesNotSetUp = checkLocalPipelinesNotSetUp(error)

  if (isFeatureFlagRequiredError || isLocalPipelinesNotSetUp) {
    return false
  }

  if (failureCount < MAX_RETRY_FAILURE_COUNT) {
    return true
  }

  return false
}

export function isDucklakeSupabaseConfig(
  config: DucklakeDestinationConfig
): config is DucklakeSupabaseDestinationConfig {
  return 'catalogProjectRef' in config
}

export const buildPipelineApiConfig = ({
  publicationName,
  batch,
  maxTableSyncWorkers,
  maxCopyConnectionsPerTable,
  invalidatedSlotBehavior,
  tableSyncCopy,
}: PipelineConfig): CreatePipelineApiConfig => ({
  publication_name: publicationName,
  max_table_sync_workers: maxTableSyncWorkers,
  max_copy_connections_per_table: maxCopyConnectionsPerTable,
  invalidated_slot_behavior: invalidatedSlotBehavior,
  table_sync_copy: tableSyncCopy,
  batch: batch
    ? {
        max_fill_ms: batch.maxFillMs,
        max_bytes: batch.maxBytes,
        memory_budget_ratio: batch.memoryBudgetRatio,
      }
    : undefined,
})

const hasClusteringColumns = (clusterBy: string[] | undefined) => (clusterBy?.length ?? 0) > 0

const isCompleteBigQueryPartition = (
  partitionBy: BigQueryPartitionBy | undefined
): partitionBy is CompleteBigQueryPartitionBy => {
  if (!partitionBy) return false
  if (partitionBy.kind === 'ingestion_time') return true
  if (!('column' in partitionBy) || partitionBy.column.trim().length === 0) return false
  if (partitionBy.kind !== 'integer_range') return true
  return (
    typeof partitionBy.start === 'number' &&
    typeof partitionBy.end === 'number' &&
    typeof partitionBy.interval === 'number'
  )
}

const buildBigQueryPartitionByApiConfig = (partitionBy: CompleteBigQueryPartitionBy) => {
  switch (partitionBy.kind) {
    case 'time_column':
      return {
        kind: partitionBy.kind,
        column: partitionBy.column,
        granularity: partitionBy.granularity,
      }
    case 'integer_range':
      return {
        kind: partitionBy.kind,
        column: partitionBy.column,
        start: partitionBy.start,
        end: partitionBy.end,
        interval: partitionBy.interval,
      }
    case 'ingestion_time':
      return { kind: partitionBy.kind, granularity: partitionBy.granularity }
  }
}

export const buildBigQueryTableOptionApiConfig = (option: BigQueryTableOption) => ({
  table_id: option.tableId,
  partition_by: isCompleteBigQueryPartition(option.partitionBy)
    ? buildBigQueryPartitionByApiConfig(option.partitionBy)
    : undefined,
  cluster_by: hasClusteringColumns(option.clusterBy) ? option.clusterBy : undefined,
})

const isBigQueryTableOptionConfigured = (option: BigQueryTableOption) =>
  isCompleteBigQueryPartition(option.partitionBy) || hasClusteringColumns(option.clusterBy)

export const getConfiguredBigQueryTableOptions = (
  tableOptions: BigQueryTableOption[] | undefined
) => (tableOptions ?? []).filter(isBigQueryTableOptionConfigured)
