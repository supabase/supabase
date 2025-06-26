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
      
      -- Request data
      edge_logs_request.path as "request.path",
      edge_logs_request.host as "request.host", 
      edge_logs_request.method as "request.method",
      edge_logs_request.url as "request.url",
      
      -- Response data
      edge_logs_response.origin_time as "response.origin_time",
      edge_logs_response.headers.content_type as "response.content_type",
      edge_logs_response.headers.cf_cache_status as "response.cache_status",
      
      -- Client location data
      edge_logs_request.cf.continent as "client.continent",
      edge_logs_request.cf.country as "client.country", 
      edge_logs_request.cf.city as "client.city",
      edge_logs_request.cf.region as "client.region",
      edge_logs_request.cf.regionCode as "client.region_code",
      edge_logs_request.cf.latitude as "client.latitude",
      edge_logs_request.cf.longitude as "client.longitude", 
      edge_logs_request.cf.timezone as "client.timezone",
      
      -- Network data
      edge_logs_request.cf.httpProtocol as "network.protocol",
      edge_logs_request.cf.colo as "network.datacenter",
      
      -- Request headers
      edge_logs_request.headers.user_agent as "headers.user_agent",
      edge_logs_request.headers.x_client_info as "headers.x_client_info",
      edge_logs_request.headers.x_forwarded_proto as "headers.x_forwarded_proto",
      edge_logs_request.headers.x_real_ip as "headers.x_real_ip",
      
      -- Auth data
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      
      -- JWT data
      sb.jwt.apikey.payload.role as "jwt.apikey_role",
      sb.jwt.apikey.payload.algorithm as "jwt.apikey_algorithm", 
      sb.jwt.apikey.payload.expires_at as "jwt.apikey_expires_at",
      sb.jwt.apikey.payload.issuer as "jwt.apikey_issuer",
      sb.jwt.apikey.payload.signature_prefix as "jwt.apikey_signature_prefix",
      
      sb.jwt.authorization.payload.role as "jwt.auth_role",
      sb.jwt.authorization.payload.algorithm as "jwt.auth_algorithm",
      sb.jwt.authorization.payload.expires_at as "jwt.auth_expires_at", 
      sb.jwt.authorization.payload.issuer as "jwt.auth_issuer",
      sb.jwt.authorization.payload.signature_prefix as "jwt.auth_signature_prefix",
      
      -- Raw data
      el as raw_log_data,
      
      -- Legacy fields for compatibility
      edge_logs_request.path as path,
      edge_logs_request.host as host,
      edge_logs_request.method as method,
      null as event_message,
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
