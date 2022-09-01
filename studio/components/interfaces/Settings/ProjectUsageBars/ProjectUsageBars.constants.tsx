import { IconArchive, IconDatabase } from '@supabase/ui'

export const usageBasedItems = [
  {
    title: 'Database',
    icon: <IconDatabase className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'db_size', title: 'Database space' },
      { key: 'db_egress', title: 'Database egress' },
    ],
  },
  {
    title: 'Storage',
    icon: <IconArchive className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      { key: 'storage_size', title: 'Storage space' },
      { key: 'storage_egress', title: 'Storage egress' },
    ],
  },
]
