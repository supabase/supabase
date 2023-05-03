export const Y_DOMAIN_CEILING_MULTIPLIER = 4 / 3

export const USAGE_STATUS = {
  NORMAL: 'NORMAL',
  APPROACHING: 'APPROACHING',
  EXCEEDED: 'EXCEEDED',
}

export const USAGE_CATEGORIES: {
  key: 'infra' | 'bandwidth' | 'sizeCount' | 'activity'
  name: string
  attributes: string[]
}[] = [
  {
    key: 'infra',
    name: 'Infrastructure',
    attributes: ['cpu_usage', 'ram_usage', 'disk_io_budget'],
  },
  { key: 'bandwidth', name: 'Bandwidth', attributes: ['db_egress', 'storage_egress'] },
  { key: 'sizeCount', name: 'Size & Counts', attributes: ['db_size', 'storage_size'] },
  {
    key: 'activity',
    name: 'Activity',
    attributes: ['monthly_active_users', 'storage_image_render_count', 'func_invocations'],
  },
]
