import {
  ActivityIcon,
  GaugeIcon,
  HardDriveIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from 'lucide-react'

/** The checks a user can ask the agent to run from Home. Hosts write the prompt for each. */
export const projectChecks = [
  {
    id: 'security',
    title: 'Security check',
    description: 'Review access controls and security findings.',
  },
  {
    id: 'health',
    title: 'Health check',
    description: 'Investigate errors and connection pressure.',
  },
  {
    id: 'performance',
    title: 'Performance check',
    description: 'Find slow queries, blockers, and bottlenecks.',
  },
  {
    id: 'capacity',
    title: 'Capacity check',
    description: 'Review resource usage and room to grow.',
  },
] as const

export type ProjectCheck = (typeof projectChecks)[number]
export type ProjectCheckId = ProjectCheck['id']

export const checkIcons: Record<ProjectCheckId, LucideIcon> = {
  security: ShieldCheckIcon,
  health: ActivityIcon,
  performance: GaugeIcon,
  capacity: HardDriveIcon,
}
