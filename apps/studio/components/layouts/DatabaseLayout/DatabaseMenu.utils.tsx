import { useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'

import { useIsColumnLevelPrivilegesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsETLPrivateAlpha } from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import type {
  ProductMenuGroup,
  ProductMenuGroupItem,
} from '@/components/ui/ProductMenu/ProductMenu.types'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

const ExternalLinkIcon = <ArrowUpRight strokeWidth={1} className="h-4 w-4" />

export const useGenerateDatabaseMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    databaseReplication: showPgReplicate,
    databaseRoles: showRoles,
    integrationsWrappers: showWrappers,
  } = useIsFeatureEnabled(['database:replication', 'database:roles', 'integrations:wrappers'])

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const pgNetExtensionExists = (data ?? []).some((ext) => ext.name === 'pg_net')
  const pitrEnabled = addons?.selected_addons.some((addon) => addon.type === 'pitr') ?? false
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()
  const enablePgReplicate = useIsETLPrivateAlpha()

  const getDatabaseURL = (path: string) => `/project/${ref}/database/${path}`

  return [
    {
      title: 'Database Management',
      items: [
        { name: 'Schema Visualizer', key: 'schemas', url: getDatabaseURL('schemas') },
        { name: 'Tables', key: 'tables', url: getDatabaseURL('tables') },
        { name: 'Functions', key: 'functions', url: getDatabaseURL('functions') },
        { name: 'Triggers', key: 'triggers', url: getDatabaseURL('triggers/data') },
        { name: 'Enumerated Types', key: 'types', url: getDatabaseURL('types') },
        { name: 'Extensions', key: 'extensions', url: getDatabaseURL('extensions') },
        { name: 'Indexes', key: 'indexes', url: getDatabaseURL('indexes') },
        { name: 'Publications', key: 'publications', url: getDatabaseURL('publications') },
      ],
    },
    {
      title: 'Configuration',
      items: [
        showRoles && { name: 'Roles', key: 'roles', url: getDatabaseURL('roles') },
        columnLevelPrivileges && {
          name: 'Column Privileges',
          key: 'column-privileges',
          url: getDatabaseURL('column-privileges'),
        },
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          rightIcon: ExternalLinkIcon,
        },
        { name: 'Settings', key: 'settings', url: getDatabaseURL('settings') },
      ].filter(Boolean) as ProductMenuGroupItem[],
    },
    {
      title: 'Platform',
      items: [
        IS_PLATFORM &&
          showPgReplicate && {
            name: 'Replication',
            key: 'replication',
            url: getDatabaseURL('replication'),
            label: enablePgReplicate ? 'New' : undefined,
          },
        IS_PLATFORM && {
          name: 'Backups',
          key: 'backups',
          url: pitrEnabled ? getDatabaseURL('backups/pitr') : getDatabaseURL('backups/scheduled'),
        },
        { name: 'Migrations', key: 'migrations', url: getDatabaseURL('migrations') },
        showWrappers && {
          name: 'Wrappers',
          key: 'wrappers',
          url: `/project/${ref}/integrations?category=wrapper`,
          rightIcon: ExternalLinkIcon,
        },
        pgNetExtensionExists && {
          name: 'Database Webhooks',
          key: 'hooks',
          url: `/project/${ref}/integrations/webhooks/overview`,
          rightIcon: ExternalLinkIcon,
        },
      ].filter(Boolean) as ProductMenuGroupItem[],
    },
    {
      title: 'Tools',
      items: [
        {
          name: 'Security Advisor',
          key: 'security-advisor',
          url: `/project/${ref}/advisors/security`,
          rightIcon: ExternalLinkIcon,
        },
        {
          name: 'Performance Advisor',
          key: 'performance-advisor',
          url: `/project/${ref}/advisors/performance`,
          rightIcon: ExternalLinkIcon,
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          rightIcon: ExternalLinkIcon,
        },
      ],
    },
  ]
}
