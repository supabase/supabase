import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'

export const generateAdvisorsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const advisorRules = useFlag('advisorRules')

  return [
    {
      title: 'Advisors',
      items: [
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
          url: `/project/${ref}/advisors/query-performance`,
          items: [],
        },
      ],
    },
    ...(IS_PLATFORM && advisorRules
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Advisor Rules',
                key: 'advisor-rules',
                url: `/project/${ref}/advisors/rules`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
