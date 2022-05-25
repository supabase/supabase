import { Project } from 'types'
import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateDatabaseMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  const HOOKS_RELEASED = '2021-07-30T15:33:54.383Z'
  const showHooksRoute = project?.inserted_at ? project.inserted_at > HOOKS_RELEASED : false

  return [
    {
      title: 'Database',
      items: [
        { name: 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        { name: 'Roles', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: 'Replication',
          key: 'replication',
          url: `/project/${ref}/database/replication`,
          items: [],
        },
        {
          name: 'Backups',
          key: 'backups',
          url: `/project/${ref}/database/backups`,
          items: [],
        },
      ],
    },
    ...(IS_PLATFORM
      ? [
        {
          title: 'Logs',
          items: [
            {
              name: 'API logs',
              key: 'api-logs',
              url: `/project/${ref}/database/api-logs`,
              items: [],
            },
            {
              name: 'Postgres logs',
              key: 'postgres-logs',
              url: `/project/${ref}/database/postgres-logs`,
              items: [],
            },
          ],
        },
      ]
      : []),
    ...(IS_PLATFORM
      ? [
        {
          title: 'Alpha Preview',
          isPreview: true,
          items: [
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
            ...(showHooksRoute
              ? [
                {
                  name: 'Function Hooks',
                  key: 'hooks',
                  url: `/project/${ref}/database/hooks`,
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
