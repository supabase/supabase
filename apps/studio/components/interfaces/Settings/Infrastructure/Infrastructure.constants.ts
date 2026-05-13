import { DOCS_URL } from '@/lib/constants'

export interface Attribute {
  key: string
  name?: string
  color: 'white' | 'blue' | 'green' | 'yellow' | 'orange'
}
export interface CategoryAttribute {
  anchor: string
  key: string // Property from organization usage
  attributes: Attribute[] // For querying against stats-daily / infra-monitoring
  name: string
  unit: 'bytes' | 'absolute' | 'percentage'
  links: {
    name: string
    url: string
  }[]
  description: string
  chartPrefix?: 'Max' | 'Average'
  chartDescription: string
}

export interface CategoryMeta {
  key: string
  name: string
  description: string
  attributes: CategoryAttribute[]
}

export const INFRA_ACTIVITY_METRICS: CategoryMeta[] = [
  {
    key: 'infra',
    name: 'Infrastructure',
    description: 'Usage statistics related to your server instance',
    attributes: [
      {
        anchor: 'cpu',
        key: 'max_cpu_usage',
        attributes: [{ key: 'max_cpu_usage', color: 'white' }],
        name: 'CPU',
        unit: 'percentage',
        description: 'Max CPU usage of your server.',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: `${DOCS_URL}/guides/platform/compute-add-ons`,
          },
          {
            name: 'High CPU Usage',
            url: `${DOCS_URL}/guides/troubleshooting/high-cpu-usage`,
          },
          {
            name: 'Metrics',
            url: `${DOCS_URL}/guides/platform/metrics`,
          },
        ],
      },
      {
        anchor: 'ram',
        key: 'ram_usage',
        attributes: [{ key: 'ram_usage', color: 'white' }],
        name: 'Memory',
        unit: 'percentage',
        description:
          'Memory usage of your server.\nYou might observe elevated memory usage, even with little to no load. Besides Postgres, a wide range of services are running under the hood resulting in an elevated base memory usage.',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: `${DOCS_URL}/guides/platform/compute-add-ons`,
          },
          {
            name: 'High RAM Usage',
            url: `${DOCS_URL}/guides/troubleshooting/exhaust-ram`,
          },
          {
            name: 'Metrics',
            url: `${DOCS_URL}/guides/platform/metrics`,
          },
        ],
      },
      {
        anchor: 'disk_io',
        key: 'disk_throughput',
        attributes: [
          { key: 'disk_bytes_read', color: 'blue' },
          { key: 'disk_bytes_written', color: 'green' },
        ],
        name: 'Disk Throughput',
        unit: 'bytes',
        links: [
          {
            name: 'Disk Throughput and IOPS',
            url: `${DOCS_URL}/guides/platform/compute-add-ons#disk-throughput-and-iops`,
          },
          {
            name: 'High Disk I/O',
            url: `${DOCS_URL}/guides/troubleshooting/exhaust-disk-io`,
          },
          {
            name: 'Metrics',
            url: `${DOCS_URL}/guides/platform/metrics`,
          },
        ],
        description:
          'Actual bytes read from and written to disk per second.\nSustained throughput near the maximum for your compute size may indicate disk pressure.',
        chartDescription: '',
      },
    ],
  },
]
