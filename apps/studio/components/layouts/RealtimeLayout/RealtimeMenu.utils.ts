import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateRealtimeMenu = (
  project: Project,
  flags?: { enableRealtimeSettings: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { enableRealtimeSettings } = flags || {}

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
    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/realtime/policies`,
          items: [],
        },
        ...(IS_PLATFORM && enableRealtimeSettings
          ? [
              {
                name: 'Settings',
                key: 'settings',
                url: `/project/${ref}/realtime/settings`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
