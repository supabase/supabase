import { IconArchive, IconDatabase } from '@supabase/ui'

export const usageBasedItems = [
  {
    title: 'Database',
    icon: <IconDatabase className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'dbSize', title: 'Database space' },
      { key: 'dbEgress', title: 'Database egress' },
    ],
  },
  {
    title: 'Storage',
    icon: <IconArchive className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'storageSize', title: 'Storage space' },
      { key: 'storageEgress', title: 'Storage egress' },
    ],
  },
]
