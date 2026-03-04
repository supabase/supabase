import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

export const generateAdvisorsMenu = (
  project?: Project,
  options?: { advisorsV2?: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const v2 = options?.advisorsV2 ?? false

  const advisorItems = [
    {
      name: 'Overview',
      key: 'advisors',
      url: `/project/${ref}/advisors`,
      items: [],
    },
    {
      name: 'Issues',
      key: 'issues',
      url: `/project/${ref}/advisors/issues`,
      items: [],
    },
    {
      name: 'Security',
      key: 'security',
      url: `/project/${ref}/advisors/security`,
      items: [],
    },
    {
      name: 'Performance',
      key: 'performance',
      url: `/project/${ref}/advisors/performance`,
      items: [],
    },
    ...(v2
      ? [
          {
            name: 'Alerts',
            key: 'alerts',
            url: `/project/${ref}/advisors/alerts`,
            items: [],
          },
        ]
      : []),
    {
      name: 'Query Performance',
      key: 'query-performance',
      url: `/project/${ref}/observability/query-performance`,
      items: [],
      rightIcon: <ArrowUpRight size={14} strokeWidth={1.5} className="h-4 w-4" />,
    },
  ]

  return [
    {
      // title: 'Advisors',
      items: advisorItems,
    },
    {
      title: 'Settings',
      items: [
        {
          name: 'Rules',
          key: 'monitoring-rules',
          url: `/project/${ref}/advisors/monitoring-rules`,
          items: [],
        },
        {
          name: 'Agents',
          key: 'agents',
          url: `/project/${ref}/advisors/agents`,
          items: [],
        },
        {
          name: 'Notifications',
          key: 'channels',
          url: `/project/${ref}/advisors/channels`,
          items: [],
        },
      ],
    },
  ]
}
