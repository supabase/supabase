/**
 * Service Flow SQL Queries
 *
 * This file contains SQL queries for fetching enriched service flow data
 * showing how requests flow through different layers of the infrastructure.
 */

/**
 * PostgREST Service Flow Query for /rest/ requests
 * Fetches enriched edge log data for PostgREST requests with additional service-specific metadata
 */
export const getPostgrestServiceFlowQuery = (logId: string): string => {
  // Query for the specific log ID only
  console.log('🔍 Generated SQL for logId:', logId)
  return `
  select 
      id,
      el.timestamp as timestamp,
      'postgrest' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as path,
      edge_logs_request.host as host,
      null as event_message,
      edge_logs_request.method as method,
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload

    -- ONLY include logs where the path includes /rest/
WHERE 
  el.id = '${logId}'
  AND edge_logs_request.path LIKE '%/rest/%'
`
}

/**
 * Future: Auth service flow query
 * For requests going through auth endpoints
 */
export const getAuthServiceFlowQuery = (
  requestId: string,
  timestamp: string,
  pathname: string
): string => {
  // TODO: Implement auth service flow
  return `-- Auth service flow query to be implemented`
}

/**
 * Future: Edge function service flow query
 * For requests going through edge functions
 */
export const getEdgeFunctionServiceFlowQuery = (
  requestId: string,
  timestamp: string,
  pathname: string
): string => {
  // TODO: Implement edge function service flow
  return `-- Edge function service flow query to be implemented`
}

/**
 * Future: Storage service flow query
 * For requests going through storage endpoints
 */
export const getStorageServiceFlowQuery = (
  requestId: string,
  timestamp: string,
  pathname: string
): string => {
  // TODO: Implement storage service flow
  return `-- Storage service flow query to be implemented`
}

/**
 * Placeholder for other service flow queries
 * TODO: Add separate queries for:
 * - getAuthServiceFlowQuery()
 * - getStorageServiceFlowQuery()
 * - getFunctionServiceFlowQuery()
 * - getRealtimeServiceFlowQuery()
 */
