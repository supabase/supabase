import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    enablePgReplicate: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { pgNetExtensionExists, pitrEnabled, columnLevelPrivileges, enablePgReplicate } =
    flags || {}

  return [
    {
      title: 'Database Management',
      items: [
        {
          name: 'Schema Visualizer',
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
        { name: 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        {
          name: 'Functions',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: 'Enumerated Types',
          key: 'types',
          url: `/project/${ref}/database/types`,

          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: 'Indexes',
          key: 'indexes',
          url: `/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: 'Publications',
          key: 'publications',
          url: `/project/${ref}/database/publications`,
          items: [],
        },
        ...(enablePgReplicate
          ? [
              {
                name: 'Replication',
                key: 'replication',
                url: `/project/${ref}/database/replication`,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: 'Access Control',
      items: [
        { name: 'Roles', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        ...(columnLevelPrivileges
          ? [
              {
                name: 'Column Privileges',
                key: 'column-privileges',
                url: `/project/${ref}/database/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        ...(IS_PLATFORM
          ? [
              {
                name: 'Backups',
                key: 'backups',
                url: pitrEnabled
                  ? `/project/${ref}/database/backups/pitr`
                  : `/project/${ref}/database/backups/scheduled`,
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
        {
          name: 'Wrappers',
          key: 'wrappers',
          url: `/project/${ref}/integrations?category=wrapper`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        ...(!!pgNetExtensionExists
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/integrations/webhooks/overview`,
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          name: 'Security Advisor',
          key: 'security-advisor',
          url: `/project/${ref}/advisors/security`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: 'Performance Advisor',
          key: 'performance-advisor',
          url: `/project/${ref}/advisors/performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/advisors/query-performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
