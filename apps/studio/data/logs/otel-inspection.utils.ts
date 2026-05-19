import type { UnifiedLogInspectionEntry } from './unified-log-inspection-query'
import { LEVELS } from '@/components/ui/DataTable/DataTable.constants'

type Level = (typeof LEVELS)[number]

export type OtelLogRow = {
  id: string
  timestamp: string
  source: string
  event_message: string
  severity_text?: string
  log_attributes?: Record<string, any>
}

const httpStatusToLevel = (status: number): Level => {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warning'
  return 'success'
}

const pgSeverityToLevel = (severity: string): Level => {
  switch (severity) {
    case 'WARNING':
      return 'warning'
    case 'ERROR':
    case 'FATAL':
    case 'CRITICAL':
    case 'PANIC':
      return 'error'
    default:
      return 'success'
  }
}

// Flattens a single OTEL row into the underscored field shape the service-flow
// panel components expect. Per-source `log_attributes` keys vary; unknown fields
// fall through to `null`.
export function flattenOtelInspectionRow(
  row: OtelLogRow
): UnifiedLogInspectionEntry & Record<string, unknown> {
  const attrs: Record<string, any> = row.log_attributes ?? {}

  // Path key differs across sources: edge_logs uses `request.path`,
  // function_edge_logs uses `request.pathname`. Coalesce.
  const requestPath = attrs['request.path'] ?? attrs['request.pathname']
  // Status: HTTP response code for gateway rows, Postgres SQL state code for postgres rows.
  const status =
    row.source === 'postgres_logs' ? attrs['parsed.sql_state_code'] : attrs['response.status_code']
  const statusNum = Number(status)

  // Derive level from HTTP status first, then postgres severity, then severity_text.
  let level = ''
  if (Number.isFinite(statusNum) && statusNum > 0) {
    level = httpStatusToLevel(statusNum)
  } else if (attrs['parsed.error_severity']) {
    level = pgSeverityToLevel(String(attrs['parsed.error_severity']))
  } else if (row.severity_text) {
    level = String(row.severity_text).toLowerCase()
  }

  return {
    // Spread raw attribute keys verbatim -- the OTEL dotted keys
    // (e.g. `request.path`) match some `enrichedData[...]` consumers.
    ...attrs,

    // Identity
    id: row.id,
    timestamp: row.timestamp,
    service_name: row.source ?? '',
    level,

    // Network -- flat aliases the panel reads as `enrichedData.request_path` etc.
    method: attrs['request.method'] ?? '',
    path: requestPath ?? '',
    host: attrs['request.host'] ?? '',
    status_code: status != null ? String(status) : '',
    request_path: requestPath ?? null,
    request_host: attrs['request.host'] ?? null,
    request_method: attrs['request.method'] ?? null,
    request_url: attrs['request.url'] ?? null,
    request_search: attrs['request.search'] ?? null,

    // Response
    response_origin_time: attrs['response.origin_time'] ?? null,
    response_content_type: attrs['response.headers.content_type'] ?? null,
    response_cache_status: attrs['response.headers.cf_cache_status'] ?? null,

    // Request headers
    headers_user_agent: attrs['request.headers.user_agent'] ?? null,
    headers_x_client_info: attrs['request.headers.x_client_info'] ?? null,
    headers_x_forwarded_proto: attrs['request.headers.x_forwarded_proto'] ?? null,
    headers_x_real_ip: attrs['request.headers.x_real_ip'] ?? null,
    headers_referer: attrs['request.headers.referer'] ?? null,

    // Cloudflare network info (also exposed under `client_*` for the panel)
    cf_ray: attrs['request.headers.cf_ray'] ?? null,
    cf_country: attrs['request.cf.country'] ?? attrs['request.headers.cf_ipcountry'] ?? null,
    cf_datacenter: attrs['request.cf.colo'] ?? null,
    client_ip:
      attrs['request.headers.cf_connecting_ip'] ?? attrs['request.headers.x_real_ip'] ?? null,
    client_continent: attrs['request.cf.continent'] ?? null,
    client_country: attrs['request.cf.country'] ?? null,
    client_city: attrs['request.cf.city'] ?? null,
    client_region: attrs['request.cf.region'] ?? null,
    client_region_code: attrs['request.cf.regionCode'] ?? null,
    client_latitude: attrs['request.cf.latitude'] ?? null,
    client_longitude: attrs['request.cf.longitude'] ?? null,
    client_timezone: attrs['request.cf.timezone'] ?? null,
    network_protocol: attrs['request.cf.httpProtocol'] ?? null,
    network_datacenter: attrs['request.cf.colo'] ?? null,

    // Edge function specific
    execution_id: attrs['execution_id'] ?? null,
    function_id: attrs['function_id'] ?? null,
    deployment_id: attrs['deployment_id'] ?? null,
    execution_time_ms: attrs['execution_time_ms'] ?? null,
    execution_region: attrs['response.headers.x_sb_edge_region'] ?? null,

    // Postgres specific (parsed.* keys)
    backend_type: attrs['parsed.backend_type'] ?? null,
    command_tag: attrs['parsed.command_tag'] ?? null,
    connection_from: attrs['parsed.connection_from'] ?? null,
    database_name: attrs['parsed.database_name'] ?? null,
    database_user: attrs['parsed.user_name'] ?? null,
    process_id: attrs['parsed.process_id'] ?? null,
    query_id: attrs['parsed.query_id'] ?? null,
    session_id: attrs['parsed.session_id'] ?? null,
    session_start_time: attrs['parsed.session_start_time'] ?? null,
    transaction_id: attrs['parsed.transaction_id'] ?? null,
    virtual_transaction_id: attrs['parsed.virtual_transaction_id'] ?? null,
    error_severity: attrs['parsed.error_severity'] ?? null,
    sql_state_code: attrs['parsed.sql_state_code'] ?? null,
    event_message: row.event_message,

    raw_log_data: row,
    service_specific_data: {},
  } as UnifiedLogInspectionEntry & Record<string, unknown>
}

// Aggregates `function_logs` rows into the count + sample fields the
// edge-function service-flow panel reads.
export function aggregateFunctionLogs(rows: OtelLogRow[]) {
  if (rows.length === 0) {
    return { function_log_count: 0, last_event_message: null, function_logs: [] }
  }
  return {
    function_log_count: rows.length,
    // BQ used ANY_VALUE; pick the most recent message for a more useful summary.
    last_event_message: rows[0]?.event_message ?? null,
    function_logs: rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      event_message: r.event_message,
      level: r.severity_text ?? r.log_attributes?.level ?? null,
      event_type: r.log_attributes?.event_type ?? null,
    })),
  }
}
