import type { components, operations } from 'api-types'

type GeneratedWarehouseMetric =
  components['schemas']['WarehouseMetricsResponse_Output']['metrics'][number]

// Added by supabase/platform#42425 and #42427. Delete this extension once they are deployed and
// `pnpm api:codegen:prod` lists these measurements.
type PendingWarehouseMetricName =
  | 'ingestion_events_received_rate'
  | 'ingestion_events_processed_rate'
  | 'ingestion_bytes_received_rate'
  | 'ingestion_bytes_processed_rate'
  | 'replication_wal_lag_bytes'
  | 'replication_receive_wal_lag_bytes'
  | 'maintenance_request_rate'
  | 'maintenance_pause_active'
  | 'maintenance_pause_duration_mean'
  | 'maintenance_run_rate'
  | 'maintenance_results_available'
  | 'maintenance_merge_adjacent_files_created_rate'
  | 'maintenance_rewrite_data_files_created_rate'
  | 'maintenance_expired_snapshots_rate'
  | 'maintenance_cleaned_up_files_rate'
  | 'inline_flush_rows_rate'
  | 'inline_flush_rows_mean'
  | 'inline_flush_duration_mean'
  | 'table_active_data_files_mean'
  | 'table_active_delete_files_mean'
  | 'table_active_data_bytes_mean'
  | 'table_active_delete_bytes_mean'
  | 'table_active_data_file_avg_size_bytes_mean'
  | 'table_small_file_ratio_mean'
  | 'table_deleted_row_ratio_mean'
  | 'table_inlined_data_bytes'
  | 'catalog_active_data_files'
  | 'catalog_deletion_backlog_files'
  | 'catalog_snapshots'
  | 'catalog_deletion_backlog_bytes'
  | 'catalog_oldest_snapshot_age'
  | 'catalog_oldest_deletion_age'

type PendingWarehouseMetricUnit =
  | 'bytes'
  | 'bytes_per_second'
  | 'files'
  | 'rows'
  | 'ratio'
  | 'boolean'
  | 'snapshots'

export type WarehouseMetricName = GeneratedWarehouseMetric['metric'] | PendingWarehouseMetricName
export type WarehouseMetric = Omit<
  GeneratedWarehouseMetric,
  'metric' | 'unit' | 'aggregation' | 'requested'
> & {
  metric: WarehouseMetricName
  unit: GeneratedWarehouseMetric['unit'] | PendingWarehouseMetricUnit
  aggregation: GeneratedWarehouseMetric['aggregation'] | 'max'
  requested: Omit<GeneratedWarehouseMetric['requested'], 'metric'> & {
    metric: WarehouseMetricName
  }
  /** Sampled storage health: `last_sample_at` proves a scrape, not a fresh sample. */
  observation_freshness?: 'unknown'
}
export type WarehouseMetricsResponse = { metrics: WarehouseMetric[] }
export type WarehouseMetricAvailability = WarehouseMetric['availability']
export type WarehouseMetricsInterval = NonNullable<
  operations['WarehouseMetricsController_getMetrics']['parameters']['query']['interval']
>
