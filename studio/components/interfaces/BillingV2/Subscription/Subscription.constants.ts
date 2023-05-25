// [Joshen] Probably need to centralize this value somewhere as it needs to be used
// by email notifications as well
export const USAGE_APPROACHING_THRESHOLD = 0.8

export const BILLING_BREAKDOWN_METRICS = [
  { key: 'db_size', name: 'Database space', units: 'bytes', anchor: 'dbSize' },
  { key: 'db_egress', name: 'Database egress', units: 'bytes', anchor: 'dbEgress' },
  { key: 'monthly_active_users', name: 'Active users', units: 'absolute', anchor: 'mau' },
  { key: 'monthly_active_sso_users', name: 'Active SSO users', units: 'absolute', anchor: 'mauSso' },
  { key: 'realtime_peak_connection', name: 'Realtime peak connections', units: 'absolute', anchor: 'realtimePeakConnections' },
  { key: 'realtime_message_count', name: 'Realtime messages', units: 'absolute', anchor: 'realtimeMessageCount' },
  { key: 'func_invocations', name: 'Edge function invocations', units: 'absolute', anchor: 'funcInvocations' },
  { key: 'func_count', name: 'Edge functions', units: 'absolute', anchor: 'funcCount' },
  { key: 'storage_size', name: 'Storage space', units: 'bytes', anchor: 'storageSize' },
  { key: 'storage_egress', name: 'Storage egress', units: 'bytes', anchor: 'storageEgress' },
  { key: 'storage_image_render_count', name: 'Asset transformations', units: 'absolute', anchor: 'storageImageTransformations' },
]
