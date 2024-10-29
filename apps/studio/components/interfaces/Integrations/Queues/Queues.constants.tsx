import { RESTApi, SqlEditor } from 'icons'
import { ScrollText } from 'lucide-react'

export const QUEUE_TYPES = [
  {
    value: 'normal',
    icon: <SqlEditor strokeWidth={1} />,
    label: 'Normal queue',
    description: 'Create a normal queue.',
  },
  {
    value: 'partitioned',
    icon: <ScrollText strokeWidth={1} />,
    label: 'Partitioned queue',
    description: 'Create a partitioned queue which is optimized ',
  },

  {
    value: 'unlogged',
    icon: <RESTApi strokeWidth={1} />,
    label: 'Unlogged queue',
    description: 'Creates an unlogged queue which loses all data on database restart.',
  },
] as const
