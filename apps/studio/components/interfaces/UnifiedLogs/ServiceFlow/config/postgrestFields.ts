import { BlockFieldConfig } from '../types'

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
