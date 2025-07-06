import { BlockFieldConfig } from '../types'

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
