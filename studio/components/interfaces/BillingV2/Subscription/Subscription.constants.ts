// [Joshen] Probably need to centralize this value somewhere as it needs to be used
// by email notifications as well
export const USAGE_APPROACHING_THRESHOLD = 0.8

export const BILLING_BREAKDOWN_METRICS = [
  {
    key: 'db_size',
    name: 'Database space',
    units: 'bytes',
    anchor: 'dbSize',
    metric: 'DATABASE_SIZE',
    category: 'Database',
    unitName: 'GB'
  },
  {
    key: 'db_egress',
    name: 'Database egress',
    units: 'bytes',
    anchor: 'dbEgress',
    metric: 'DATABASE_EGRESS',
    category: 'Database',
    unitName: 'GB'
  },
  {
    key: 'monthly_active_users',
    name: 'Active users',
    units: 'absolute',
    anchor: 'mau',
    metric: 'MONTHLY_ACTIVE_USERS',
    category: 'Authentication',
    unitName: 'MAU'
  },
  {
    key: 'monthly_active_sso_users',
    name: 'Active SSO users',
    units: 'absolute',
    anchor: 'mauSso',
    metric: 'MONTHLY_ACTIVE_SSO_USERS',
    category: 'Authentication',
    unitName: 'MAU'
  },
  {
    key: 'storage_size',
    name: 'Storage space',
    units: 'bytes',
    anchor: 'storageSize',
    metric: 'STORAGE_SIZE',
    category: 'Storage',
    unitName: 'GB'
  },
  {
    key: 'storage_egress',
    name: 'Storage egress',
    units: 'bytes',
    anchor: 'storageEgress',
    metric: 'STORAGE_EGRESS',
    category: 'Storage',
    unitName: 'GB'
  },
  {
    key: 'storage_image_render_count',
    name: 'Storage Image Transformations',
    units: 'absolute',
    anchor: 'storageImageTransformations',
    metric: 'STORAGE_IMAGES_TRANSFORMED',
    category: 'Storage',
    unitName: 'image'
  },
  {
    key: 'realtime_peak_connection',
    name: 'Realtime peak connections',
    units: 'absolute',
    anchor: 'realtimePeakConnections',
    metric: 'REALTIME_PEAK_CONNECTIONS',
    category: 'Realtime',
    unitName: 'connection'
  },
  {
    key: 'realtime_message_count',
    name: 'Realtime messages',
    units: 'absolute',
    anchor: 'realtimeMessageCount',
    metric: 'REALTIME_MESSAGE_COUNT',
    category: 'Realtime',
    unitName: 'message'
  },
  {
    key: 'func_invocations',
    name: 'Edge Function invocations',
    units: 'absolute',
    anchor: 'funcInvocations',
    metric: 'FUNCTION_INVOCATIONS',
    category: 'Edge Functions',
    unitName: 'invocation'
  },
  {
    key: 'func_count',
    name: 'Edge Functions',
    units: 'absolute',
    anchor: 'funcCount',
    metric: 'FUNCTION_COUNT',
    category: 'Edge Functions',
    unitName: 'function'
  },
] as const
