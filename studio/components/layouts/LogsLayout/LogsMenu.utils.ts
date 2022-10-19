import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateLogsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const logsRealtime = useFlag('logsRealtime')
  const reportsOverview = useFlag('reportsOverview')

  return [
    {
      title: 'Logs',
      items: [
        {
          name: 'Explorer',
          key: 'explorer',
          url: `/project/${ref}/logs/explorer`,
          items: [],
        },
        {
          name: 'Postgres logs',
          key: 'postgres-logs',
          url: `/project/${ref}/logs/postgres-logs`,
          items: [],
        },
        {
          name: 'PostgREST logs',
          key: 'postgrest-logs',
          url: `/project/${ref}/logs/postgrest-logs`,
          items: [],
        },
        {
          name: 'Auth logs',
          key: 'auth-logs',
          url: `/project/${ref}/logs/auth-logs`,
          items: [],
        },
        {
          name: 'Storage logs',
          key: 'storage-logs',
          url: `/project/${ref}/logs/storage-logs`,
          items: [],
        },

        {
          name: 'Realtime logs',
          key: 'realtime-logs',
          url: `/project/${ref}/logs/realtime-logs`,
          items: [],
        },

        ...(reportsOverview
          ? [
              {
                name: 'API usage',
                key: 'api-usage',
                url: `/project/${ref}/logs/api-usage`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
