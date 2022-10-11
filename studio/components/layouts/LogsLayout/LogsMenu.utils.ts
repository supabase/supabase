import { Project } from 'types'
import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateLogsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const logsRealtime = useFlag('logsRealtime')

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
          name: 'Query logs(?)',
          key: 'api-logs',
          url: `/project/${ref}/database/insights?`,
          items: [],
        },
        {
          name: 'PostgREST logs',
          key: 'api-logs',
          url: `/project/${ref}/database/api-logs`,
          items: [],
        },
        {
          name: 'API logs(?)',
          key: 'api-logs',
          url: `/project/${ref}/database/api-logs`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Auth logs',
                key: 'logs',
                url: `/project/${ref}/auth/logs`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Auth audit logs(?)',
                key: 'logs',
                url: `/project/${ref}/auth/logs`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Storage logs',
                key: 'logs',
                url: `/project/${ref}/storage/logs`,
                items: [],
              },
            ]
          : []),

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
}
