import { Project } from 'types'
import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateDatabaseMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const logsRealtime = useFlag('logsRealtime')
  const reportsOverview = useFlag('reportsOverview')

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
          url: `/project/${ref}/database/backups/scheduled`,
          items: [],
        },
      ],
    },
    ...(IS_PLATFORM
      ? [
        {
          title: 'Logs and Usage',
          items: [
            {
              name: 'API logs',
              key: 'api-logs',
              url: `/project/${ref}/database/api-logs`,
              items: [],
            },
            ...(reportsOverview
              ? [
                {
                  name: 'API usage',
                  key: 'api-usage',
                  url: `/project/${ref}/database/api-usage`,
                  items: [],
                },
              ]
              : []),
            {
              name: 'Postgres logs',
              key: 'postgres-logs',
              url: `/project/${ref}/database/postgres-logs`,
              items: [],
            },
            ...(logsRealtime
              ? [
                {
                  name: 'Realtime logs',
                  key: 'realtime-logs',
                  url: `/project/${ref}/database/realtime-logs`,
                  items: [],
                },
              ]
              : []),
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
                  name: 'Database Webhooks',
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
