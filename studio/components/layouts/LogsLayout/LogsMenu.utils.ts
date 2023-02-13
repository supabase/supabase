import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateLogsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    ...(IS_PLATFORM
      ? [
          {
            title: 'Logs Explorer',
            items: [
              { key: 'explorer', name: 'Query', root: true },
              { key: 'saved', name: 'Saved Queries' },
              { key: 'recent', name: 'Recent Queries' },
              { key: 'templates', name: 'Templates' },
            ].map(({ key, name, root }) => ({
              name,
              key,
              url: `/project/${ref}/logs/explorer${root ? '' : '/' + key}`,
              items: [],
            })),
          },
          {
            items: [
              {
                name: 'API Edge Network',
                key: 'edge-logs',
                url: `/project/${ref}/logs/edge-logs`,
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
                name: 'PgBouncer',
                key: 'pgbouncer-logs',
                url: `/project/${ref}/logs/pgbouncer-logs`,
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
      : []),
  ]
}
