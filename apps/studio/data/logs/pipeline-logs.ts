import { safeSql, type SafeLogSqlFragment } from './safe-analytics-sql'

export const PIPELINE_ID_OTEL_SQL = safeSql`coalesce(nullIf(log_attributes['pipeline_id_v2'], ''), log_attributes['pipeline_id'])`

export const getPipelineIdBigQuerySql = (row: SafeLogSqlFragment): SafeLogSqlFragment =>
  // JSON lookup also works before the endpoint exposes pipeline_id_v2.
  safeSql`coalesce(nullif(json_value(to_json_string(${row}), '$.pipeline_id_v2'), ''), cast(${row}.pipeline_id as string))`
