/**
 * Service Flow SQL Queries
 *
 * This file contains SQL queries for fetching enriched service flow data
 * showing how requests flow through different layers of the infrastructure.
 */

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false

/**
 * PostgREST Service Flow Query for /rest/ requests
 * Fetches enriched edge log data for PostgREST requests with additional service-specific metadata
 */
export const getPostgrestServiceFlowQuery = (logId: string): string => {
  // Query for the specific log ID only
  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Generated SQL for logId:', logId)
  }
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
      edge_logs_request.path as request_path,
      edge_logs_request.host as request_host, 
      edge_logs_request.method as request_method,
      edge_logs_request.url as request_url,
      edge_logs_request.search as request_search,
      
      -- Response data
      edge_logs_response.origin_time as response_origin_time,
      edge_logs_response_headers.content_type as response_content_type,
      edge_logs_response_headers.cf_cache_status as response_cache_status,
      
      -- Client location data
      edge_logs_cf.continent as client_continent,
      edge_logs_cf.country as client_country, 
      edge_logs_cf.city as client_city,
      edge_logs_cf.region as client_region,
      edge_logs_cf.regionCode as client_region_code,
      edge_logs_cf.latitude as client_latitude,
      edge_logs_cf.longitude as client_longitude, 
      edge_logs_cf.timezone as client_timezone,
      
      -- Network data
      edge_logs_cf.httpProtocol as network_protocol,
      edge_logs_cf.colo as network_datacenter,
      
      -- Request headers
      edge_logs_request_headers.user_agent as headers_user_agent,
      edge_logs_request_headers.x_client_info as headers_x_client_info,
      edge_logs_request_headers.x_forwarded_proto as headers_x_forwarded_proto,
      edge_logs_request_headers.x_real_ip as headers_x_real_ip,
      edge_logs_request_headers.referer as headers_referer,
      
      -- Auth data
      authorization_payload.role as api_role,
  COALESCE(sb.auth_user, null) as auth_user,
      
      -- JWT Key Authentication (old keys)
      CASE
          WHEN apikey_payload.algorithm = 'HS256' AND 
               apikey_payload.issuer = 'supabase' AND 
               apikey_payload.role IN ('anon', 'service_role') AND 
               apikey_payload.subject IS NULL
          THEN apikey_payload.role
          WHEN sb_apikey.invalid IS NOT NULL THEN '<invalid>'
          WHEN apikey_payload IS NOT NULL THEN '<unrecognized>'
          ELSE NULL
      END as jwt_key_role,
      
      apikey_payload.signature_prefix as jwt_key_prefix,
      
      -- API Key Authentication (new keys from sb.apikey[0].apikey[0])
      CASE 
          WHEN sb_apikey_inner.prefix LIKE '%publishable%' THEN 'anon'
          WHEN sb_apikey_inner.prefix LIKE '%secret%' THEN 'service_role'
          WHEN sb_apikey_inner.prefix IS NOT NULL THEN 'unknown'
          ELSE NULL
      END as api_key_role,
      
      sb_apikey_inner.prefix as api_key_prefix,
      sb_apikey_inner.error as api_key_error,
      sb_apikey_inner.hash as api_key_hash,
      
      -- User Authorization 
      authorization_payload.role as authorization_role,
      authorization_payload.subject as user_id,
      null as user_email,
      
      -- Cloudflare Network Info
      edge_logs_response_headers.cf_ray as cf_ray,
      edge_logs_request_headers.cf_ipcountry as cf_country,
      edge_logs_cf.colo as cf_datacenter,
      edge_logs_request_headers.cf_connecting_ip as client_ip,
      
      -- JWT data
      apikey_payload.role as jwt_apikey_role,
      apikey_payload.algorithm as jwt_apikey_algorithm, 
      apikey_payload.expires_at as jwt_apikey_expires_at,
      apikey_payload.issuer as jwt_apikey_issuer,
      apikey_payload.signature_prefix as jwt_apikey_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.key_id') as jwt_apikey_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.session_id') as jwt_apikey_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.subject') as jwt_apikey_subject,
      
      authorization_payload.role as jwt_auth_role,
      authorization_payload.algorithm as jwt_auth_algorithm,
      authorization_payload.expires_at as jwt_auth_expires_at, 
      authorization_payload.issuer as jwt_auth_issuer,
      authorization_payload.signature_prefix as jwt_auth_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.key_id') as jwt_auth_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.session_id') as jwt_auth_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.subject') as jwt_auth_subject,
      
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
    left join unnest(edge_logs_response.headers) as edge_logs_response_headers
    left join unnest(edge_logs_request.headers) as edge_logs_request_headers
    left join unnest(edge_logs_request.cf) as edge_logs_cf
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.apikey) as sb_apikey
    left join unnest(sb_apikey.payload) as apikey_payload
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload
    left join unnest(sb.apikey) as sb_apikey_outer
    left join unnest(sb_apikey_outer.apikey) as sb_apikey_inner

    -- ONLY include logs where the path includes /rest/
WHERE 
  el.id = '${logId}'
  AND edge_logs_request.path LIKE '%/rest/%'
`
}

/**
 * Auth Service Flow Query for /auth/ requests
 * Fetches enriched edge log data for GoTrue auth requests with service-specific metadata
 */
export const getAuthServiceFlowQuery = (logId: string): string => {
  // Query starts with auth_logs and JOINs to edge_logs for service flow data
  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Generated Auth SQL for logId:', logId)
  }
  return `
  select 
      el.id as id,
      el.timestamp as timestamp,
      'auth' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
        WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
        WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
        WHEN edge_logs_response.status_code >= 500 THEN 'error'
        ELSE 'success'
      END as level,
      
      -- Request data
      edge_logs_request.path as request_path,
      edge_logs_request.host as request_host, 
      edge_logs_request.method as request_method,
      edge_logs_request.url as request_url,
      edge_logs_request.search as request_search,
      
      -- Response data
      edge_logs_response.origin_time as response_origin_time,
      edge_logs_response_headers.content_type as response_content_type,
      edge_logs_response_headers.cf_cache_status as response_cache_status,
      
      -- Client location data
      edge_logs_cf.continent as client_continent,
      edge_logs_cf.country as client_country, 
      edge_logs_cf.city as client_city,
      edge_logs_cf.region as client_region,
      edge_logs_cf.regionCode as client_region_code,
      edge_logs_cf.latitude as client_latitude,
      edge_logs_cf.longitude as client_longitude, 
      edge_logs_cf.timezone as client_timezone,
      
      -- Network data
      edge_logs_cf.httpProtocol as network_protocol,
      edge_logs_cf.colo as network_datacenter,
      
      -- Request headers
      edge_logs_request_headers.user_agent as headers_user_agent,
      edge_logs_request_headers.x_client_info as headers_x_client_info,
      edge_logs_request_headers.x_forwarded_proto as headers_x_forwarded_proto,
      edge_logs_request_headers.x_real_ip as headers_x_real_ip,
      edge_logs_request_headers.referer as headers_referer,
      
      -- Auth data
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      
      -- JWT Key Authentication (old keys)
      CASE
          WHEN apikey_payload.algorithm = 'HS256' AND 
               apikey_payload.issuer = 'supabase' AND 
               apikey_payload.role IN ('anon', 'service_role') AND 
               apikey_payload.subject IS NULL
          THEN apikey_payload.role
          WHEN sb_apikey.invalid IS NOT NULL THEN '<invalid>'
          WHEN apikey_payload IS NOT NULL THEN '<unrecognized>'
          ELSE NULL
      END as jwt_key_role,
      
      apikey_payload.signature_prefix as jwt_key_prefix,
      
      -- API Key Authentication (new keys from sb.apikey[0].apikey[0])
      CASE 
          WHEN sb_apikey_inner.prefix LIKE '%publishable%' THEN 'anon'
          WHEN sb_apikey_inner.prefix LIKE '%secret%' THEN 'service_role'
          WHEN sb_apikey_inner.prefix IS NOT NULL THEN 'unknown'
          ELSE NULL
      END as api_key_role,
      
      sb_apikey_inner.prefix as api_key_prefix,
      sb_apikey_inner.error as api_key_error,
      sb_apikey_inner.hash as api_key_hash,
      
      -- User Authorization 
      authorization_payload.role as authorization_role,
      authorization_payload.subject as user_id,
      null as user_email,
      
      -- Cloudflare Network Info
      edge_logs_response_headers.cf_ray as cf_ray,
      edge_logs_request_headers.cf_ipcountry as cf_country,
      edge_logs_cf.colo as cf_datacenter,
      edge_logs_request_headers.cf_connecting_ip as client_ip,
      
      -- JWT data
      apikey_payload.role as jwt_apikey_role,
      apikey_payload.algorithm as jwt_apikey_algorithm, 
      apikey_payload.expires_at as jwt_apikey_expires_at,
      apikey_payload.issuer as jwt_apikey_issuer,
      apikey_payload.signature_prefix as jwt_apikey_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.key_id') as jwt_apikey_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.session_id') as jwt_apikey_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.subject') as jwt_apikey_subject,
      
      authorization_payload.role as jwt_auth_role,
      authorization_payload.algorithm as jwt_auth_algorithm,
      authorization_payload.expires_at as jwt_auth_expires_at, 
      authorization_payload.issuer as jwt_auth_issuer,
      authorization_payload.signature_prefix as jwt_auth_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.key_id') as jwt_auth_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.session_id') as jwt_auth_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.subject') as jwt_auth_subject,
      
      -- Raw data
      el as raw_log_data,
      
      -- Legacy fields for compatibility
      edge_logs_request.path as path,
      edge_logs_request.host as host,
      edge_logs_request.method as method,
      null as event_message,
      null as log_count,
      null as logs
      
    -- Start with auth_logs and JOIN to edge_logs (same pattern as UnifiedLogs.queries.ts)
    from auth_logs as al
    cross join unnest(metadata) as al_metadata 
    left join (
      edge_logs as el
      cross join unnest(metadata) as edge_logs_metadata
      cross join unnest(edge_logs_metadata.request) as edge_logs_request
      cross join unnest(edge_logs_metadata.response) as edge_logs_response
      left join unnest(edge_logs_response.headers) as edge_logs_response_headers
      left join unnest(edge_logs_request.headers) as edge_logs_request_headers
      left join unnest(edge_logs_request.cf) as edge_logs_cf
      left join unnest(edge_logs_request.sb) as sb
      left join unnest(sb.jwt) as jwt
      left join unnest(jwt.apikey) as sb_apikey
      left join unnest(sb_apikey.payload) as apikey_payload
      left join unnest(jwt.authorization) as auth
      left join unnest(auth.payload) as authorization_payload
      left join unnest(sb.apikey) as sb_apikey_outer
      left join unnest(sb_apikey_outer.apikey) as sb_apikey_inner
    ) on al_metadata.request_id = edge_logs_response_headers.cf_ray

    -- Filter by auth log ID and ensure we have a valid correlation
WHERE 
  al.id = '${logId}'
  AND al_metadata.request_id IS NOT NULL
`
}

/**
 * Edge Function Service Flow Query for edge function requests
 * Fetches enriched function_edge_logs data with correlated function logs
 */
export const getEdgeFunctionServiceFlowQuery = (logId: string): string => {
  // Query for edge function logs with function logs correlation
  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Generated Edge Function SQL for logId:', logId)
  }
  return `
  select 
      fel.id as id,
      fel.timestamp as timestamp,
      'edge-function' as log_type,
      CAST(fel_response.status_code AS STRING) as status,
      CASE
        WHEN fel_response.status_code BETWEEN 200 AND 299 THEN 'success'
        WHEN fel_response.status_code BETWEEN 400 AND 499 THEN 'warning'
        WHEN fel_response.status_code >= 500 THEN 'error'
        ELSE 'success'
      END as level,
          
      -- Request data
      fel_request.pathname as request_path,
      fel_request.host as request_host, 
      fel_request.method as request_method,
      fel_request.url as request_url,
      null as request_search,
      
      -- Response data
      fel_response_headers.date as response_origin_time,
      fel_response_headers.content_type as response_content_type,
      null as response_cache_status,
      
      -- Client location data (not available in function_edge_logs)
      null as client_continent,
      null as client_country, 
      null as client_city,
      null as client_region,
      null as client_region_code,
      null as client_latitude,
      null as client_longitude, 
      null as client_timezone,
      
      -- Network data (not available in function_edge_logs)
      null as network_protocol,
      null as network_datacenter,
      
      -- Request headers
      fel_request_headers.user_agent as headers_user_agent,
      fel_request_headers.x_client_info as headers_x_client_info,
      null as headers_x_forwarded_proto,
      null as headers_x_real_ip,
      null as headers_referer,
      
      -- Auth data
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      
      -- JWT Key Authentication (old keys)
      CASE
          WHEN apikey_payload.issuer = 'supabase' AND 
               apikey_payload.role IN ('anon', 'service_role')
          THEN apikey_payload.role
          WHEN sb_apikey.invalid IS NOT NULL THEN '<invalid>'
          WHEN apikey_payload IS NOT NULL THEN '<unrecognized>'
          ELSE NULL
      END as jwt_key_role,
      
      apikey_payload.signature_prefix as jwt_key_prefix,
      
      -- API Key Authentication (new keys from sb.apikey[0].apikey[0])
      CASE 
          WHEN sb_apikey_inner.prefix LIKE '%publishable%' THEN 'anon'
          WHEN sb_apikey_inner.prefix LIKE '%secret%' THEN 'service_role'
          WHEN sb_apikey_inner.prefix IS NOT NULL THEN 'unknown'
          ELSE NULL
      END as api_key_role,
      
      sb_apikey_inner.prefix as api_key_prefix,
      sb_apikey_inner.error as api_key_error,
      sb_apikey_inner.hash as api_key_hash,
      
      -- User Authorization 
      authorization_payload.role as authorization_role,
      authorization_payload.subject as user_id,
      null as user_email,
      
      -- Cloudflare Network Info (not available in function_edge_logs)
      null as cf_ray,
      null as cf_country,
      null as cf_datacenter,
      null as client_ip,
      
      -- JWT data
      apikey_payload.role as jwt_apikey_role,
      apikey_payload.algorithm as jwt_apikey_algorithm, 
      apikey_payload.expires_at as jwt_apikey_expires_at,
      apikey_payload.issuer as jwt_apikey_issuer,
      apikey_payload.signature_prefix as jwt_apikey_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.key_id') as jwt_apikey_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.session_id') as jwt_apikey_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.subject') as jwt_apikey_subject,
      
      authorization_payload.role as jwt_auth_role,
      authorization_payload.algorithm as jwt_auth_algorithm,
      authorization_payload.expires_at as jwt_auth_expires_at, 
      authorization_payload.issuer as jwt_auth_issuer,
      authorization_payload.signature_prefix as jwt_auth_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.key_id') as jwt_auth_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.session_id') as jwt_auth_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.subject') as jwt_auth_subject,
      
      -- Edge Function specific data
      fel_metadata.execution_id as execution_id,
      fel_metadata.execution_time_ms as execution_time_ms,
      fel_metadata.function_id as function_id,
      function_logs_agg.function_log_count as function_log_count,
      function_logs_agg.last_event_message as last_event_message,
      
      -- Raw data
      fel as raw_log_data,
      
      -- Legacy fields for compatibility
      fel_request.pathname as path,
      fel_request.host as host,
      fel_request.method as method,
      COALESCE(function_logs_agg.last_event_message, '') as event_message,
      function_logs_agg.function_log_count as log_count,
      function_logs_agg.logs as logs
      
    from function_edge_logs as fel
    cross join unnest(metadata) as fel_metadata
    cross join unnest(fel_metadata.response) as fel_response
    cross join unnest(fel_metadata.request) as fel_request
    left join unnest(fel_response.headers) as fel_response_headers
    left join unnest(fel_request.headers) as fel_request_headers
    left join unnest(fel_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.apikey) as sb_apikey
    left join unnest(sb_apikey.payload) as apikey_payload
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload
    left join unnest(sb.apikey) as sb_apikey_outer
    left join unnest(sb_apikey_outer.apikey) as sb_apikey_inner
    left join (
      SELECT
          fl_metadata.execution_id,
          COUNT(fl.id) as function_log_count,
          ANY_VALUE(fl.event_message) as last_event_message,
          ANY_VALUE(fl_metadata.region) as execution_region,
          ARRAY_AGG(STRUCT(fl.id, fl.timestamp, fl.event_message, fl_metadata.level, fl_metadata.event_type) ORDER BY fl.timestamp ASC) as logs
      FROM function_logs as fl
      CROSS JOIN UNNEST(fl.metadata) as fl_metadata
      WHERE fl_metadata.execution_id IS NOT NULL
      GROUP BY fl_metadata.execution_id
    ) as function_logs_agg on fel_metadata.execution_id = function_logs_agg.execution_id

WHERE 
  fel.id = '${logId}'
`
}

/**
 * Storage Service Flow Query for /storage/ requests
 * Fetches enriched edge log data for Storage requests with service-specific metadata
 */
export const getStorageServiceFlowQuery = (logId: string): string => {
  // Query for the specific log ID only
  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Generated Storage SQL for logId:', logId)
  }
  return `
  select 
      id,
      el.timestamp as timestamp,
      'storage' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
  CASE
    WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
    WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
    WHEN edge_logs_response.status_code >= 500 THEN 'error'
    ELSE 'success'
  END as level,
      
      -- Request data
      edge_logs_request.path as request_path,
      edge_logs_request.host as request_host, 
      edge_logs_request.method as request_method,
      edge_logs_request.url as request_url,
      edge_logs_request.search as request_search,
      
      -- Response data
      edge_logs_response.origin_time as response_origin_time,
      edge_logs_response_headers.content_type as response_content_type,
      edge_logs_response_headers.cf_cache_status as response_cache_status,
      
      -- Client location data
      edge_logs_cf.continent as client_continent,
      edge_logs_cf.country as client_country, 
      edge_logs_cf.city as client_city,
      edge_logs_cf.region as client_region,
      edge_logs_cf.regionCode as client_region_code,
      edge_logs_cf.latitude as client_latitude,
      edge_logs_cf.longitude as client_longitude, 
      edge_logs_cf.timezone as client_timezone,
      
      -- Network data
      edge_logs_cf.httpProtocol as network_protocol,
      edge_logs_cf.colo as network_datacenter,
      
      -- Request headers
      edge_logs_request_headers.user_agent as headers_user_agent,
      edge_logs_request_headers.x_client_info as headers_x_client_info,
      edge_logs_request_headers.x_forwarded_proto as headers_x_forwarded_proto,
      edge_logs_request_headers.x_real_ip as headers_x_real_ip,
      edge_logs_request_headers.referer as headers_referer,
      
      -- Auth data
      authorization_payload.role as api_role,
  COALESCE(sb.auth_user, null) as auth_user,
      
      -- JWT Key Authentication (old keys)
      CASE
          WHEN apikey_payload.algorithm = 'HS256' AND 
               apikey_payload.issuer = 'supabase' AND 
               apikey_payload.role IN ('anon', 'service_role') AND 
               apikey_payload.subject IS NULL
          THEN apikey_payload.role
          WHEN sb_apikey.invalid IS NOT NULL THEN '<invalid>'
          WHEN apikey_payload IS NOT NULL THEN '<unrecognized>'
          ELSE NULL
      END as jwt_key_role,
      
      apikey_payload.signature_prefix as jwt_key_prefix,
      
      -- API Key Authentication (new keys from sb.apikey[0].apikey[0])
      CASE 
          WHEN sb_apikey_inner.prefix LIKE '%publishable%' THEN 'anon'
          WHEN sb_apikey_inner.prefix LIKE '%secret%' THEN 'service_role'
          WHEN sb_apikey_inner.prefix IS NOT NULL THEN 'unknown'
          ELSE NULL
      END as api_key_role,
      
      sb_apikey_inner.prefix as api_key_prefix,
      sb_apikey_inner.error as api_key_error,
      sb_apikey_inner.hash as api_key_hash,
      
      -- User Authorization 
      authorization_payload.role as authorization_role,
      authorization_payload.subject as user_id,
      null as user_email,
      
      -- Cloudflare Network Info
      edge_logs_response_headers.cf_ray as cf_ray,
      edge_logs_request_headers.cf_ipcountry as cf_country,
      edge_logs_cf.colo as cf_datacenter,
      edge_logs_request_headers.cf_connecting_ip as client_ip,
      
      -- JWT data
      apikey_payload.role as jwt_apikey_role,
      apikey_payload.algorithm as jwt_apikey_algorithm, 
      apikey_payload.expires_at as jwt_apikey_expires_at,
      apikey_payload.issuer as jwt_apikey_issuer,
      apikey_payload.signature_prefix as jwt_apikey_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.key_id') as jwt_apikey_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.session_id') as jwt_apikey_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(apikey_payload), '$.subject') as jwt_apikey_subject,
      
      authorization_payload.role as jwt_auth_role,
      authorization_payload.algorithm as jwt_auth_algorithm,
      authorization_payload.expires_at as jwt_auth_expires_at, 
      authorization_payload.issuer as jwt_auth_issuer,
      authorization_payload.signature_prefix as jwt_auth_signature_prefix,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.key_id') as jwt_auth_key_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.session_id') as jwt_auth_session_id,
      JSON_EXTRACT_SCALAR(TO_JSON_STRING(authorization_payload), '$.subject') as jwt_auth_subject,
      
      -- Storage specific data
      edge_logs_request_headers.content_length as storage_content_length,
      edge_logs_request_headers.content_type as storage_request_content_type,
      edge_logs_response_headers.content_disposition as storage_content_disposition,
      edge_logs_response_headers.etag as storage_etag,
      edge_logs_response_headers.last_modified as storage_last_modified,
      
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
    left join unnest(edge_logs_response.headers) as edge_logs_response_headers
    left join unnest(edge_logs_request.headers) as edge_logs_request_headers
    left join unnest(edge_logs_request.cf) as edge_logs_cf
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.apikey) as sb_apikey
    left join unnest(sb_apikey.payload) as apikey_payload
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload
    left join unnest(sb.apikey) as sb_apikey_outer
    left join unnest(sb_apikey_outer.apikey) as sb_apikey_inner

    -- ONLY include logs where the path includes /storage/
WHERE 
  el.id = '${logId}'
  AND edge_logs_request.path LIKE '%/storage/%'
`
}

/**
 * Placeholder for other service flow queries
 * TODO: Add separate queries for:
 * - getAuthServiceFlowQuery()
 * - getStorageServiceFlowQuery()
 * - getFunctionServiceFlowQuery()
 * - getRealtimeServiceFlowQuery()
 */
