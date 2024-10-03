import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateProjectIntegrationsMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    cronUiEnabled: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { pgNetExtensionExists, cronUiEnabled } = flags || {}

  return [
    {
      items: [
        ...(!!pgNetExtensionExists
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/integrations/hooks`,
                items: [],
              },
            ]
          : []),
        {
          name: 'Wrappers',
          key: 'wrappers',
          url: `/project/${ref}/integrations/wrappers`,
          items: [],
        },
        ...(!!cronUiEnabled
          ? [
              {
                name: 'Cron Jobs',
                key: 'cron-jobs',
                url: `/project/${ref}/integrations/cron-jobs`,
                items: [],
              },
            ]
          : []),
        {
          name: 'GraphiQL',
          key: 'graphiql',
          url: `/project/${ref}/integrations/graphiql`,
          items: [],
        },
        {
          name: 'Vault',
          key: 'vault',
          url: `/project/${ref}/integrations/vault/secrets`,
          items: [],
          label: 'BETA',
        },
      ],
    },
  ]
}
