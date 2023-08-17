import { Project } from 'types'
import { ProductMenuGroup, ProductMenuGroupItem } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateLogsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Logs Explorer',
      items: (
        [
          { key: 'explorer', name: 'Query', root: true },
          IS_PLATFORM ? { key: 'saved', name: 'Saved Queries' } : null,
          { key: 'recent', name: 'Recent Queries' },
          { key: 'templates', name: 'Templates' },
        ].filter((item) => item) as { name: string; key: string; root: boolean }[]
      ).map(({ key, name, root }) => ({
        name,
        key,
        url: `/project/${ref}/logs/explorer${root ? '' : '/' + key}`,
        items: [],
      })),
    },
    {
      items: [
        {
          name: IS_PLATFORM ? 'API Edge Network' : 'Kong API',
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
        IS_PLATFORM
          ? {
              name: 'Pooler',
              key: 'pooler-logs',
              url: `/project/${ref}/logs/pooler-logs`,
              items: [],
            }
          : null,
        ,
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
      ].filter((item) => item) as ProductMenuGroupItem[],
    },
  ]
}
