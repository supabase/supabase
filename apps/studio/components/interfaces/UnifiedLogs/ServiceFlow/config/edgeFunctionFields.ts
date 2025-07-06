import { BlockFieldConfig } from '../types'

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
