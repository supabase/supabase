import { safeSql } from '@/data/logs/safe-analytics-sql'

export const AUTH_STATUS_SQL = safeSql`COALESCE(
  SAFE_CAST(json_value(al.event_message, '$.status') AS INT64),
  SAFE_CAST(regexp_extract(json_value(al.event_message, '$.msg'), r'^([0-9]{3})\\b') AS INT64),
  SAFE_CAST(regexp_extract(json_value(al.event_message, '$.error'), r'^([0-9]{3})\\b') AS INT64),
  SAFE_CAST(json_value(to_json_string(al_metadata), '$.status') AS INT64),
  edge_logs_response.status_code
)`

export const AUTH_LEVEL_SQL = safeSql`CASE
  WHEN ${AUTH_STATUS_SQL} >= 500 THEN 'error'
  WHEN ${AUTH_STATUS_SQL} BETWEEN 400 AND 499 THEN 'warning'
  WHEN ${AUTH_STATUS_SQL} BETWEEN 200 AND 299 THEN 'success'
  WHEN lower(coalesce(json_value(al.event_message, '$.level'), json_value(to_json_string(al_metadata), '$.level'), '')) IN ('error', 'fatal', 'panic') THEN 'error'
  WHEN lower(coalesce(json_value(al.event_message, '$.level'), json_value(to_json_string(al_metadata), '$.level'), '')) IN ('warn', 'warning') THEN 'warning'
  ELSE 'success'
END`

export const AUTH_PATH_SQL = safeSql`coalesce(json_value(al.event_message, '$.path'), json_value(to_json_string(al_metadata), '$.path'), edge_logs_request.path)`
export const AUTH_METHOD_SQL = safeSql`coalesce(json_value(al.event_message, '$.method'), json_value(to_json_string(al_metadata), '$.method'), edge_logs_request.method)`

export const AUTH_LOGS_FROM_SQL = safeSql`
FROM auth_logs AS al
LEFT JOIN UNNEST(al.metadata) AS al_metadata
LEFT JOIN (
  edge_logs AS el
  CROSS JOIN UNNEST(el.metadata) AS edge_logs_metadata
  CROSS JOIN UNNEST(edge_logs_metadata.response) AS edge_logs_response
  LEFT JOIN UNNEST(edge_logs_response.headers) AS edge_logs_response_headers
  CROSS JOIN UNNEST(edge_logs_metadata.request) AS edge_logs_request
) ON al_metadata.request_id = edge_logs_response_headers.cf_ray
`
