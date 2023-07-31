import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    foreignDataWrappersEnabled: boolean
    pgNetExtensionExists: boolean
    schemaVisualizerEnabled: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { foreignDataWrappersEnabled, pgNetExtensionExists, schemaVisualizerEnabled } = flags || {}

  return [
    {
      title: 'Database',
      items: [
        { name: 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        ...(!!schemaVisualizerEnabled
          ? [
              {
                name: 'Schema Visualizer',
                key: 'schemas',
                url: `/project/${ref}/database/schemas`,
                items: [],
              },
            ]
          : []),
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: 'Functions',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        { name: 'Roles', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        {
          name: 'Replication',
          key: 'replication',
          url: `/project/${ref}/database/replication`,
          items: [],
        },
        ...(!!pgNetExtensionExists
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/database/hooks`,
                items: [],
              },
            ]
          : []),
        ...(!!foreignDataWrappersEnabled
          ? [
              {
                name: 'Wrappers',
                key: 'wrappers',
                url: `/project/${ref}/database/wrappers`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Backups',
                key: 'backups',
                url: `/project/${ref}/database/backups/scheduled`,
                items: [],
              },
            ]
          : []),
        {
          name: 'Migrations',
          key: 'migrations',
          url: `/project/${ref}/database/migrations`,
          items: [],
        },
      ],
    },
  ]
}
