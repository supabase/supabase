import { Rows2, Rows3, Rows4 } from 'lucide-react'

export const QUEUE_TYPES = [
  {
    value: 'normal',
    icon: <Rows4 strokeWidth={1} />,
    label: 'Normal queue',
    description: 'Create a normal queue.',
  },
  {
    value: 'partitioned',
    icon: <Rows3 strokeWidth={1} />,
    label: 'Partitioned queue',
    description: 'Create a partitioned queue which is optimized for large amount of messages',
  },

  {
    value: 'unlogged',
    icon: <Rows2 strokeWidth={1} />,
    label: 'Unlogged queue',
    description: 'Creates an unlogged queue which loses all data on database restart.',
  },
] as const
