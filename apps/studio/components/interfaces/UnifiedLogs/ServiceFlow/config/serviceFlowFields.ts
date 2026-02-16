import { formatBytes } from 'lib/helpers'
import { BlockFieldConfig } from '../types'
import { getStorageMetadata } from '../utils/storageUtils'

// Helper functions that avoid duplication with existing storage utilities
const getFileName = (path: string): string => {
  if (!path) return ''
  // Remove query parameters and hash
  const cleanPath = path.split('?')[0].split('#')[0]
  // Get the last part after the last slash
  const segments = cleanPath.split('/')
  return segments[segments.length - 1] || ''
}

const formatStorageDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

// =============================================================================
// NETWORK FIELDS
// =============================================================================

// Field configurations - using filterable field IDs where possible
export const originFields: BlockFieldConfig[] = [
  {
    id: 'date', // Matches filterFields 'date' (timerange) - FILTERABLE
    label: 'Time',
    getValue: (data) => {
      if (!data?.timestamp && !data?.date) return null
      try {
        const timestamp = data?.timestamp || data?.date
        return new Date(timestamp).toLocaleString()
      } catch {
        return 'Invalid date'
      }
    },
  },
]

// Primary Network Fields (Always Visible) - FILTERABLE
export const networkPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'host', // Matches filterFields 'host' (input) - FILTERABLE
    label: 'Host',
    getValue: (data, enrichedData) =>
      enrichedData?.request_host || enrichedData?.host || data?.host,
  },
  {
    id: 'method', // Matches filterFields 'method' (checkbox) - FILTERABLE
    label: 'Method',
    getValue: (data, enrichedData) =>
      enrichedData?.request_method || enrichedData?.method || data?.method,
  },
  {
    id: 'pathname', // Matches filterFields 'pathname' (input) - FILTERABLE
    label: 'Path',
    getValue: (data, enrichedData) =>
      enrichedData?.request_path || enrichedData?.pathname || data?.pathname,
  },
  {
    id: 'user_agent',
    label: 'Client',
    getValue: (data, enrichedData) => {
      const userAgent = enrichedData?.headers_user_agent
      if (!userAgent) return null
      // TODO: Parse user agent for nice display with icons
      return userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent
    },
    requiresEnrichedData: true,
  },
]

// Primary API Key Field (Always Visible) - Shows API key type only
export const apiKeyPrimaryField: BlockFieldConfig = {
  id: 'api_key_role',
  label: 'API Key',
  getValue: (data, enrichedData) => {
    const prefix = enrichedData?.api_key_prefix
    const jwtRole = enrichedData?.jwt_key_role
    const authRole = enrichedData?.authorization_role

    if (prefix) {
      // Extract key type from prefix
      if (prefix.includes('publishable')) return 'publishable'
      else if (prefix.includes('secret')) return 'secret'
      return 'unknown'
    }

    // Fallback to JWT apikey postgres role if no API key prefix
    if (jwtRole) {
      return jwtRole
    }

    // Fallback to authorization postgres role if no apikey JWT
    if (authRole) {
      return authRole
    }

    return null
  },
  requiresEnrichedData: true,
}

// Additional API Key Fields (Collapsible)
export const apiKeyAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'api_key_prefix_full',
    label: 'API Key Prefix',
    getValue: (data, enrichedData) => {
      const prefix = enrichedData?.api_key_prefix
      return prefix || null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'postgres_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.jwt_key_role,
    requiresEnrichedData: true,
  },
  {
    id: 'api_key_error',
    label: 'API Key Error',
    getValue: (data, enrichedData) => enrichedData?.api_key_error,
    requiresEnrichedData: true,
  },
  {
    id: 'api_key_hash',
    label: 'API Key Hash',
    getValue: (data, enrichedData) => {
      const hash = enrichedData?.api_key_hash
      return hash ? `${hash.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'authorization_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.authorization_role,
    requiresEnrichedData: true,
  },
]

// Primary User Field (Always Visible)
export const userPrimaryField: BlockFieldConfig = {
  id: 'user_id',
  label: 'User',
  getValue: (data, enrichedData) => {
    const userId = enrichedData?.user_id
    return userId ? `${userId.substring(0, 8)}...` : null
  },
  requiresEnrichedData: true,
}

// Additional User Fields (Collapsible)
export const userAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'auth_user', // Matches filterFields 'auth_user' (input) - FILTERABLE
    label: 'Auth User',
    getValue: (data, enrichedData) => enrichedData?.auth_user || data?.auth_user,
  },
  {
    id: 'user_email',
    label: 'User Email',
    getValue: (data, enrichedData) => enrichedData?.user_email,
    requiresEnrichedData: true,
  },
]

// Primary Location Field (Always Visible)
export const locationPrimaryField: BlockFieldConfig = {
  id: 'client_country',
  label: 'Location',
  getValue: (data, enrichedData) => {
    const country = enrichedData?.client_country || enrichedData?.cf_country
    const city = enrichedData?.client_city
    if (country && city) return `${city}, ${country}`
    if (country) return country
    if (city) return city
    return null
  },
  requiresEnrichedData: true,
}

// Additional Location Fields (Collapsible) - includes IP addresses
export const locationAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'client_continent',
    label: 'Continent',
    getValue: (data, enrichedData) => enrichedData?.client_continent,
    requiresEnrichedData: true,
  },
  {
    id: 'client_region',
    label: 'Region',
    getValue: (data, enrichedData) => enrichedData?.client_region,
    requiresEnrichedData: true,
  },
  {
    id: 'client_timezone',
    label: 'Timezone',
    getValue: (data, enrichedData) => enrichedData?.client_timezone,
    requiresEnrichedData: true,
  },
  {
    id: 'x_real_ip',
    label: 'Real IP',
    getValue: (data, enrichedData) => enrichedData?.headers_x_real_ip,
    requiresEnrichedData: true,
  },
  {
    id: 'client_ip',
    label: 'Client IP',
    getValue: (data, enrichedData) => enrichedData?.client_ip,
    requiresEnrichedData: true,
  },
]

// Authorization Fields (Collapsible) - JWT authorization details
export const authorizationFields: BlockFieldConfig[] = [
  {
    id: 'jwt_auth_key_id',
    label: 'Key ID',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_key_id || enrichedData?.jwt_apikey_key_id,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_session_id',
    label: 'Session ID',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_session_id || enrichedData?.jwt_apikey_session_id,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_subject',
    label: 'Subject',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_subject || enrichedData?.jwt_apikey_subject,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_issuer',
    label: 'Issuer',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_issuer || enrichedData?.jwt_apikey_issuer,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_algorithm',
    label: 'Algorithm',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_algorithm || enrichedData?.jwt_apikey_algorithm,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_expires_at',
    label: 'Expires At',
    getValue: (data, enrichedData) => {
      const expiresAt = enrichedData?.jwt_auth_expires_at || enrichedData?.jwt_apikey_expires_at
      if (!expiresAt) return null
      try {
        return new Date(expiresAt * 1000).toLocaleString()
      } catch {
        return expiresAt
      }
    },
    requiresEnrichedData: true,
  },
]

// Tech Details Fields (Collapsible)
export const techDetailsFields: BlockFieldConfig[] = [
  {
    id: 'network_protocol',
    label: 'Protocol',
    getValue: (data, enrichedData) => enrichedData?.network_protocol,
    requiresEnrichedData: true,
  },
  {
    id: 'cf_datacenter',
    label: 'Datacenter',
    getValue: (data, enrichedData) =>
      enrichedData?.network_datacenter || enrichedData?.cf_datacenter,
    requiresEnrichedData: true,
  },
  {
    id: 'cache_status',
    label: 'Cache Status',
    getValue: (data, enrichedData) => enrichedData?.response_cache_status,
    requiresEnrichedData: true,
  },
  {
    id: 'cf_ray',
    label: 'CF-Ray',
    getValue: (data, enrichedData) => enrichedData?.cf_ray,
    requiresEnrichedData: true,
  },
  {
    id: 'x_client_info',
    label: 'SDK',
    getValue: (data, enrichedData) => enrichedData?.headers_x_client_info,
    requiresEnrichedData: true,
  },
  {
    id: 'x_forwarded_proto',
    label: 'Forwarded Proto',
    getValue: (data, enrichedData) => enrichedData?.headers_x_forwarded_proto,
    requiresEnrichedData: true,
  },
]

// =============================================================================
// POSTGREST FIELDS
// =============================================================================

// Primary PostgREST Fields (Always Visible) - FILTERABLE
export const postgrestPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status', // Matches filterFields 'status' (checkbox) - FILTERABLE
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'postgres_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.api_role,
    requiresEnrichedData: true,
  },
  {
    id: 'response_time',
    label: 'Response Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.response_origin_time || data?.response_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: true,
  },
]

// PostgREST Response Details (Collapsible)
export const postgrestResponseFields: BlockFieldConfig[] = [
  {
    id: 'query_params',
    label: 'Query',
    getValue: (data, enrichedData) => enrichedData?.request_search,
    requiresEnrichedData: true,
  },
  {
    id: 'content_type',
    label: 'Content Type',
    getValue: (data, enrichedData) => enrichedData?.response_content_type,
    requiresEnrichedData: true,
  },
  {
    id: 'message',
    label: 'Message',
    getValue: (data, enrichedData) => enrichedData?.message,
    requiresEnrichedData: true,
  },
]

// =============================================================================
// AUTH FIELDS
// =============================================================================

// Primary GoTrue/Auth Fields (Always Visible)
export const authPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'auth_path',
    label: 'Auth Path',
    getValue: (data, enrichedData) => {
      return enrichedData?.path || enrichedData?.request_path || data?.path
    },
    requiresEnrichedData: true,
  },
  {
    id: 'log_id',
    label: 'Log ID',
    getValue: (data, enrichedData) => {
      const logId = data?.id || enrichedData?.id
      return logId ? `${logId.substring(0, 8)}...` : null
    },
  },
  {
    id: 'referer',
    label: 'Referer',
    getValue: (data, enrichedData) => {
      return enrichedData?.headers_referer || null
    },
    requiresEnrichedData: true,
  },
]

// =============================================================================
// EDGE FUNCTION FIELDS
// =============================================================================

// Primary Edge Function Fields (Always Visible)
export const edgeFunctionPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'function_path',
    label: 'Function Path',
    getValue: (data, enrichedData) => {
      return (
        enrichedData?.path || enrichedData?.request_path || data?.path || enrichedData?.request_url
      )
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_time',
    label: 'Execution Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.execution_time_ms || data?.execution_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_id',
    label: 'Execution ID',
    getValue: (data, enrichedData) => {
      const execId = enrichedData?.execution_id || data?.execution_id
      return execId ? `${execId.substring(0, 8)}...` : null
    },
    requiresEnrichedData: false,
  },
]

// Edge Function Details (Collapsible)
export const edgeFunctionDetailsFields: BlockFieldConfig[] = [
  {
    id: 'function_id',
    label: 'Function ID',
    getValue: (data, enrichedData) => {
      const funcId = enrichedData?.function_id || data?.function_id
      return funcId ? `${funcId.substring(0, 8)}...` : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_region',
    label: 'Execution Region',
    getValue: (data, enrichedData) => {
      return enrichedData?.execution_region || data?.execution_region || null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'function_log_count',
    label: 'Function Logs',
    getValue: (data, enrichedData) => {
      const count = enrichedData?.function_log_count || data?.function_log_count || data?.log_count
      return count ? `${count} logs` : 'No logs'
    },
    requiresEnrichedData: false,
  },
  {
    id: 'method',
    label: 'Method',
    getValue: (data, enrichedData) => enrichedData?.method || data?.method,
    requiresEnrichedData: false,
  },
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.headers_user_agent || data?.headers_user_agent
      return ua ? (ua.length > 30 ? `${ua.substring(0, 30)}...` : ua) : null
    },
    requiresEnrichedData: false,
  },
]

// =============================================================================
// STORAGE FIELDS
// =============================================================================

// Primary Storage Fields (Always Visible)
export const storagePrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'filename',
    label: 'File Name',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      return path ? getFileName(path) : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'content_type_size',
    label: 'Type & Size',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      // For deleted objects, show status message
      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return `Error ${status}`
      }

      // Try to get metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const mimeType = metadata?.mimetype
      const size = metadata?.size

      // Fallback to headers if metadata not available
      const contentType =
        mimeType ||
        enrichedData?.response_content_type ||
        enrichedData?.storage_request_content_type
      const contentLength =
        size ||
        (enrichedData?.storage_content_length
          ? parseInt(enrichedData.storage_content_length)
          : null)

      if (contentType && contentLength) {
        return `${contentType} - ${formatBytes(contentLength)}`
      } else if (contentType) {
        return contentType
      } else if (contentLength) {
        return formatBytes(contentLength)
      }
      return 'Unknown type'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'response_time',
    label: 'Response Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.response_origin_time || data?.response_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: true,
  },
]

// Storage Details (Collapsible)
export const storageDetailsFields: BlockFieldConfig[] = [
  {
    id: 'storage_path',
    label: 'Storage Path',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      // Extract just the object path from the full storage path
      const match = path?.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)/)
      if (match) {
        const [, bucketName, objectPath] = match
        return `${bucketName}/${objectPath}`
      }
      return path
    },
    requiresEnrichedData: false,
  },
  {
    id: 'last_modified',
    label: 'Last Modified',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      // Try to get dates from metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const updatedAt = metadata?.updated_at || data?.updated_at || enrichedData?.updated_at
      const lastModified = enrichedData?.storage_last_modified || updatedAt

      return lastModified ? formatStorageDate(lastModified) : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'etag',
    label: 'ETag',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      const etag = enrichedData?.storage_etag
      return etag ? `${etag.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'content_disposition',
    label: 'Content Disposition',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      return enrichedData?.storage_content_disposition || null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'method',
    label: 'Method',
    getValue: (data, enrichedData) => enrichedData?.method || data?.method,
    requiresEnrichedData: false,
  },
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.headers_user_agent || data?.headers_user_agent
      return ua ? (ua.length > 30 ? `${ua.substring(0, 30)}...` : ua) : null
    },
    requiresEnrichedData: false,
  },
]

// =============================================================================
// POSTGRES FIELDS
// =============================================================================

// Primary Postgres Fields (Always Visible)
export const postgresPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'command_tag',
    label: 'Command',
    getValue: (data, enrichedData) => enrichedData?.command_tag || data?.command_tag,
    requiresEnrichedData: true,
  },
  {
    id: 'database_name',
    label: 'Database',
    getValue: (data, enrichedData) => enrichedData?.database_name || data?.database_name,
    requiresEnrichedData: true,
  },
  {
    id: 'database_user',
    label: 'User',
    getValue: (data, enrichedData) => enrichedData?.database_user || data?.database_user,
    requiresEnrichedData: true,
  },
]

// Postgres Details (Collapsible)
export const postgresDetailsFields: BlockFieldConfig[] = [
  {
    id: 'backend_type',
    label: 'Backend Type',
    getValue: (data, enrichedData) => enrichedData?.backend_type || data?.backend_type,
    requiresEnrichedData: true,
  },
  {
    id: 'connection_from',
    label: 'Connection From',
    getValue: (data, enrichedData) => enrichedData?.connection_from || data?.connection_from,
    requiresEnrichedData: true,
  },
  {
    id: 'session_id',
    label: 'Session ID',
    getValue: (data, enrichedData) => {
      const sessionId = enrichedData?.session_id || data?.session_id
      return sessionId ? `${sessionId.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'process_id',
    label: 'Process ID',
    getValue: (data, enrichedData) => enrichedData?.process_id || data?.process_id,
    requiresEnrichedData: true,
  },
  {
    id: 'query_id',
    label: 'Query ID',
    getValue: (data, enrichedData) => {
      const queryId = enrichedData?.query_id || data?.query_id
      return queryId ? String(queryId) : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'transaction_id',
    label: 'Transaction ID',
    getValue: (data, enrichedData) => {
      const txId = enrichedData?.transaction_id || data?.transaction_id
      return txId ? String(txId) : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'virtual_transaction_id',
    label: 'Virtual TX ID',
    getValue: (data, enrichedData) =>
      enrichedData?.virtual_transaction_id || data?.virtual_transaction_id,
    requiresEnrichedData: true,
  },
  {
    id: 'session_start_time',
    label: 'Session Started',
    getValue: (data, enrichedData) => {
      const startTime = enrichedData?.session_start_time || data?.session_start_time
      return startTime ? new Date(startTime).toLocaleString() : null
    },
    requiresEnrichedData: true,
  },
]
