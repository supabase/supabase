import { IconArchive, IconDatabase, IconKey } from 'ui'

export const usageBasedItems = [
  {
    title: 'Database',
    icon: <IconDatabase className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'db_size', title: 'Database space', units: 'bytes' },
      { key: 'db_egress', title: 'Database egress', units: 'bytes' },
    ],
  },
  {
    title: 'Auth',
    icon: <IconKey className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [{ key: 'monthly_active_users', title: 'Monthly Active Users', units: 'absolute' }],
  },
  {
    title: 'Storage',
    icon: <IconArchive className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'storage_size', title: 'Storage space', units: 'bytes' },
      { key: 'storage_egress', title: 'Storage egress', units: 'bytes' },
    ],
  },
]
