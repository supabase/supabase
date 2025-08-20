import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateRealtimeMenu = (
  project: Project,
  flags?: { enableRealtimeSettings: boolean; showPolicies: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { enableRealtimeSettings, showPolicies } = flags || {}
  const showRealtimeSettings = IS_PLATFORM && enableRealtimeSettings

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
    ...(showRealtimeSettings || showPolicies
      ? [
          {
            title: 'Configuration',
            items: [
              ...(showPolicies
                ? [
                    {
                      name: 'Policies',
                      key: 'policies',
                      url: `/project/${ref}/realtime/policies`,
                      items: [],
                    },
                  ]
                : []),
              ...(showRealtimeSettings
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
      : []),
  ]
}
