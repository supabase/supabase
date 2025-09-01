import type { FilterProperty } from 'ui-patterns/FilterBar'

export const edgeFunctionFilterProperties = (
  functions: { id: string; name: string; slug: string }[]
): FilterProperty[] => [
  {
    label: 'Function',
    name: 'function_id',
    type: 'string' as const,
    options: functions.map((fn) => ({
      label: fn.slug,
      value: fn.id,
    })),
    operators: ['=', '!='],
  },
  {
    label: 'Status Code',
    name: 'status_code',
    type: 'number' as const,
    options: [
      { label: '200 - Success', value: 200 },
      { label: '400 - Bad Request', value: 400 },
      { label: '401 - Unauthorized', value: 401 },
      { label: '403 - Forbidden', value: 403 },
      { label: '404 - Not Found', value: 404 },
      { label: '500 - Internal Server Error', value: 500 },
      { label: '502 - Bad Gateway', value: 502 },
      { label: '503 - Service Unavailable', value: 503 },
      { label: '504 - Gateway Timeout', value: 504 },
    ],
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
  {
    label: 'Region',
    name: 'region',
    type: 'string' as const,
    options: [
      { label: 'us-east-1', value: 'us-east-1' },
      { label: 'us-west-1', value: 'us-west-1' },
      { label: 'eu-west-1', value: 'eu-west-1' },
      { label: 'ap-southeast-1', value: 'ap-southeast-1' },
      { label: 'ap-northeast-1', value: 'ap-northeast-1' },
    ],
    operators: ['=', '!='],
  },
  {
    label: 'Execution Time',
    name: 'execution_time_ms',
    type: 'number' as const,
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
]
