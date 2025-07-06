import { BlockFieldConfig } from '../types'

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
  {
    id: 'error_severity',
    label: 'Severity',
    getValue: (data, enrichedData) => enrichedData?.error_severity || data?.error_severity,
    requiresEnrichedData: true,
  },
  {
    id: 'sql_state_code',
    label: 'SQL State',
    getValue: (data, enrichedData) => enrichedData?.sql_state_code || data?.sql_state_code,
    requiresEnrichedData: true,
  },
]
