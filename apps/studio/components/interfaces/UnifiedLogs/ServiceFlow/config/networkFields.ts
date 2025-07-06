import { BlockFieldConfig } from '../types'

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
