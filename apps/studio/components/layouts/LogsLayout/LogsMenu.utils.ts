import type {
  ProductMenuGroup,
  ProductMenuGroupItem,
} from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateLogsMenu = (
  project?: Project,
  features?: { auth?: boolean; storage?: boolean; realtime?: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  const authEnabled = features?.auth ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  return [
    {
      title: 'Explorer',
      items: (
        [
          { key: 'explorer', name: 'Query', root: true },
          IS_PLATFORM ? { key: 'saved', name: 'Saved Queries' } : null,
          { key: 'recent', name: 'Recent Queries' },
          IS_PLATFORM ? { key: 'templates', name: 'Templates' } : null,
        ].filter((item) => item) as { name: string; key: string; root: boolean }[]
      ).map(({ key, name, root }) => ({
        name,
        key,
        url: `/project/${ref}/logs/explorer${root ? '' : '/' + key}`,
        items: [],
      })),
    },
    {
      title: 'Infrastructure Logs',
      items: [
        {
          name: 'API Gateway',
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
        authEnabled
          ? {
              name: 'Auth',
              key: 'auth-logs',
              url: `/project/${ref}/logs/auth-logs`,
              items: [],
            }
          : null,
        storageEnabled
          ? {
              name: 'Storage',
              key: 'storage-logs',
              url: `/project/${ref}/logs/storage-logs`,
              items: [],
            }
          : null,
        realtimeEnabled
          ? {
              name: 'Realtime',
              key: 'realtime-logs',
              url: `/project/${ref}/logs/realtime-logs`,
              items: [],
            }
          : null,
      ].filter((item) => item) as ProductMenuGroupItem[],
    },
  ]
}
