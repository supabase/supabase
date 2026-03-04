import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

export const generateAdvisorsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Advisors',
      items: [
        {
          name: 'Issues',
          key: 'issues',
          url: `/project/${ref}/advisors/issues`,
          items: [],
        },
        {
          name: 'Security Advisor',
          key: 'security',
          url: `/project/${ref}/advisors/security`,
          items: [],
        },
        {
          name: 'Performance Advisor',
          key: 'performance',
          url: `/project/${ref}/advisors/performance`,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          items: [],
          rightIcon: <ArrowUpRight size={14} strokeWidth={1.5} className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Monitoring',
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
      ],
    },
    ...(IS_PLATFORM
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Settings',
                key: 'rules',
                url: `/project/${ref}/advisors/rules/security`,
                items: [],
              },
              {
                name: 'Channels',
                key: 'channels',
                url: `/project/${ref}/advisors/channels`,
                items: [],
              },
            ],
          },
        ]
      : [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Channels',
                key: 'channels',
                url: `/project/${ref}/advisors/channels`,
                items: [],
              },
            ],
          },
        ]),
  ]
}
