import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateLogsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  return [
    {
      items: [
        {
          name: 'Logs Explorer',
          key: 'explorer',
          url: `/project/${ref}/logs/explorer`,
          items: [],
        },
        {
          name: 'Postgres',
          key: 'postgres-logs',
          url: `/project/${ref}/logs/postgres-logs`,
          items: [],
        },
        {
          name: 'PostgREST',
          key: 'postgrest-logs',
          url: `/project/${ref}/logs/postgrest-logs`,
          items: [],
        },
        {
          name: 'Auth',
          key: 'auth-logs',
          url: `/project/${ref}/logs/auth-logs`,
          items: [],
        },
        {
          name: 'Storage',
          key: 'storage-logs',
          url: `/project/${ref}/logs/storage-logs`,
          items: [],
        },

        {
          name: 'Realtime',
          key: 'realtime-logs',
          url: `/project/${ref}/logs/realtime-logs`,
          items: [],
        },
      ],
    },
  ]
}
