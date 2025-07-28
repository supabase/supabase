import { Rows2, Rows3, Rows4 } from 'lucide-react'

export const QUEUE_TYPES = [
  {
    value: 'basic',
    icon: <Rows4 strokeWidth={1} />,
    label: 'Basic queue',
    description: 'Create a basic queue.',
  },
  {
    value: 'unlogged',
    icon: <Rows2 strokeWidth={1} />,
    label: 'Unlogged queue',
    description:
      'Creates an unlogged queue which loses all data on database restart. Can be useful when write throughput is more important than durability.',
  },
  {
    value: 'partitioned',
    icon: <Rows3 strokeWidth={1} />,
    label: 'Partitioned queue',
    description: 'Create a partitioned queue which is optimized for large amount of messages',
  },
] as const
