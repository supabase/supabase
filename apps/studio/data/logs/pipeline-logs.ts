import { safeSql, type SafeLogSqlFragment } from './safe-analytics-sql'

export const PIPELINE_ID_OTEL_SQL = safeSql`log_attributes['pipeline_id_v2']`

export const getPipelineIdBigQuerySql = (row: SafeLogSqlFragment): SafeLogSqlFragment =>
  // JSON lookup works before the endpoint schema exposes pipeline_id_v2.
  safeSql`json_value(to_json_string(${row}), '$.pipeline_id_v2')`
