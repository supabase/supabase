export const Y_DOMAIN_CEILING_MULTIPLIER = 4 / 3

export const USAGE_STATUS = {
  NORMAL: 'NORMAL',
  APPROACHING: 'APPROACHING',
  EXCEEDED: 'EXCEEDED',
}

export interface CategoryAttribute {
  key: string
  name: string
  description: string
  chartDescription: string
}
export const USAGE_CATEGORIES: {
  key: 'infra' | 'bandwidth' | 'sizeCount' | 'activity'
  name: string
  attributes: CategoryAttribute[]
}[] = [
  {
    key: 'infra',
    name: 'Infrastructure',
    attributes: [
      {
        key: 'cpu_usage',
        name: 'CPU usage',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'ram_usage',
        name: 'Memory usage',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'disk_io_budget',
        name: 'IO budget',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
    ],
  },
  {
    key: 'bandwidth',
    name: 'Bandwidth',
    attributes: [
      {
        key: 'db_egress',
        name: 'Database egress',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'storage_egress',
        name: 'Storage egress',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
    ],
  },
  {
    key: 'sizeCount',
    name: 'Size & Counts',
    attributes: [
      {
        key: 'db_size',
        name: 'Database size',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'storage_size',
        name: 'Storage size',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
    ],
  },
  {
    key: 'activity',
    name: 'Activity',
    attributes: [
      {
        key: 'monthly_active_users',
        name: 'Monthly active users (MAU)',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'storage_image_render_count',
        name: 'Storage image transformations',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
      {
        key: 'func_invocations',
        name: 'Edge function invocations',
        description: 'Some description here',
        chartDescription: 'Some description here',
      },
    ],
  },
]
