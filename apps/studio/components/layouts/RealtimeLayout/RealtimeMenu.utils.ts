import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (
  project: Project,
  { authzEnabled }: { authzEnabled: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Tools',
      items: [
        {
          name: 'Inspector',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    ...(authzEnabled
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Policies',
                key: 'policies',
                url: `/project/${ref}/realtime/policies`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
