export const Y_DOMAIN_CEILING_MULTIPLIER = 4 / 3

export const USAGE_STATUS = {
  NORMAL: 'NORMAL',
  APPROACHING: 'APPROACHING',
  EXCEEDED: 'EXCEEDED',
}

export interface CategoryAttribute {
  anchor: string
  key: string // Property from project usage
  attribute: string // For querying against stats-daily / infra-monitoring
  name: string
  unit: 'bytes' | 'absolute' | 'percentage'
  links?: {
    name: string
    url: string
  }[]
  description: string
  chartDescription: string
}

export const USAGE_CATEGORIES: {
  key: 'infra' | 'bandwidth' | 'sizeCount' | 'activity'
  name: string
  description: string
  attributes: CategoryAttribute[]
}[] = [
  {
    key: 'infra',
    name: 'Infrastructure',
    description: 'Usage statistics related to your Postgres server',
    attributes: [
      {
        anchor: 'cpu',
        key: 'cpu_usage',
        attribute: 'cpu_usage',
        name: 'CPU',
        unit: 'percentage',
        description: 'CPU usage of your server',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
          { name: 'High CPU Usage', url: 'https://supabase.com/docs/guides/platform/exhaust-cpu' },
        ],
      },
      {
        anchor: 'ram',
        key: 'ram_usage',
        attribute: 'ram_usage',
        name: 'Memory',
        unit: 'percentage',
        description: 'Memory usage of your server',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
        ],
      },
      {
        anchor: 'disk_io_budget',
        key: 'disk_io_budget',
        attribute: 'disk_io_budget',
        name: 'Disk IO bandwidth',
        unit: 'percentage',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons#disk-io-bandwidth',
          },
        ],
        description:
          'SSD Disks are attached to your servers and the disk performance of your workload is determined by the Disk IO bandwidth of this connection.',
        chartDescription: '',
      },
    ],
  },
  {
    key: 'bandwidth',
    name: 'Bandwidth',
    description: 'Amount of data transmitted over network connections',
    attributes: [
      {
        anchor: 'dbEgress',
        key: 'db_egress',
        attribute: 'total_egress_modified',
        name: 'Database egress',
        unit: 'bytes',
        description:
          'Contains any outgoing traffic (egress) from your database\nBilling is based on the total sum of egress in GB throughout your billing period.',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'storageEgress',
        key: 'storage_egress',
        attribute: 'total_storage_egress',
        name: 'Storage egress',
        unit: 'bytes',
        description:
          'All requests to download/view your storage items go through our CDN. We sum up all outgoing traffic (egress) for storage related requests through our CDN. We do not differentiate between cache and no cache hits.\nBilling is based on the total amount of egress in GB throughout your billing period.',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
    ],
  },
  {
    key: 'sizeCount',
    name: 'Size & Counts',
    description: 'Amount of resources your project is consuming',
    attributes: [
      {
        anchor: 'dbSize',
        key: 'db_size',
        attribute: 'total_db_size_bytes',
        name: 'Database size',
        unit: 'bytes',
        description:
          'Billing is based on the average daily database size in GB throughout the billing period.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/database-size',
          },
        ],
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'storageSize',
        key: 'storage_size',
        attribute: 'total_storage_size_bytes',
        name: 'Storage size',
        unit: 'bytes',
        description:
          'Sum of all objects in your storage buckets\nBilling is based on the average size in GB throughout your billing period',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'funcCount',
        key: 'func_count',
        attribute: 'total_func_count',
        name: 'Edge function count',
        unit: 'absolute',
        description:
          'Number of serverless functions in your project\nBilling is based on the maximum amount of functions at any point in time throughout your billing period',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
    ],
  },
  {
    key: 'activity',
    name: 'Activity',
    description: 'Usage statistics that reflect the activity of your project',
    attributes: [
      {
        anchor: 'mau',
        key: 'monthly_active_users',
        attribute: 'total_auth_billing_period_mau',
        name: 'Monthly active users',
        unit: 'absolute',
        description:
          'Users who log in or refresh their token\nBilling is based on the sum of distinct users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data shown here is refreshed over a period of 24 hours and resets at the beginning of every billing period.',
      },
      {
        anchor: 'mauSso',
        key: 'monthly_active_sso_users',
        attribute: 'total_auth_billing_period_sso_mau',
        name: 'Monthly active single sign-on users',
        unit: 'absolute',
        description:
          'SSO users who log in or refresh their token\nBilling is based on the sum of distinct Single Sign-On users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data shown here is refreshed over a period of 24 hours and resets at the beginning of every billing period.',
      },
      {
        anchor: 'storageImageTransformations',
        key: 'storage_image_render_count',
        attribute: 'total_storage_image_render_count',
        name: 'Storage image transformations',
        unit: 'absolute',
        description:
          'We distinctly count all images that were transformed in the billing period, ignoring any transformations. If you transform one image with different transformations, it only counts as one.\nBilling is based on the unique count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'functionInvocations',
        key: 'func_invocations',
        attribute: 'total_func_invocations',
        name: 'Edge function invocations',
        unit: 'absolute',
        description:
          'Every single serverless function invocation independent of response status is counted.\nBilling is based on the sum of all invocations throughout your billing period.',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'realtimeMessageCount',
        key: 'realtime_message_count',
        attribute: 'total_realtime_message_count',
        name: 'Realtime message count',
        unit: 'absolute',
        description:
          "Count of messages going through Realtime. If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
      {
        anchor: 'realtimePeakConnection',
        key: 'realtime_peak_connection',
        attribute: 'total_realtime_peak_connection',
        name: 'Realtime peak connections',
        unit: 'absolute',
        description:
          'Total number of successful connections (not connection attempts)\nBilling is based on the maximum amount of concurrent peak connections throughout your billing period.',
        chartDescription: 'The data shown here is refreshed over a period of 24 hours.',
      },
    ],
  },
]

// [Joshen] Ideally live in common package for www as well
export const COMPUTE_INSTANCE_SPECS: {
  [key: string]: { maxBandwidth: number; baseBandwidth: number }
} = {
  addon_instance_micro: {
    maxBandwidth: 2085,
    baseBandwidth: 87,
  },
  addon_instance_small: {
    maxBandwidth: 2085,
    baseBandwidth: 174,
  },
  addon_instance_medium: {
    maxBandwidth: 2085,
    baseBandwidth: 347,
  },
  addon_instance_large: {
    maxBandwidth: 4750,
    baseBandwidth: 630,
  },
  addon_instance_xlarge: {
    maxBandwidth: 4750,
    baseBandwidth: 1188,
  },
  addon_instance_xxlarge: {
    maxBandwidth: 4750,
    baseBandwidth: 2375,
  },
  addon_instance_4xlarge: {
    maxBandwidth: 4750,
    baseBandwidth: 4750,
  },
  addon_instance_8xlarge: {
    maxBandwidth: 9500,
    baseBandwidth: 9500,
  },
  addon_instance_12xlarge: {
    maxBandwidth: 14250,
    baseBandwidth: 14250,
  },
  addon_instance_16xlarge: {
    maxBandwidth: 19000,
    baseBandwidth: 19000,
  },
}
