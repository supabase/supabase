import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { ArrowUpRight } from 'lucide-react'

export const generateDatabaseMenu = (
  slug: string,
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
          url: `/org/${slug}/project/${ref}/database/schemas`,
          items: [],
        },
        { name: 'Tables', key: 'tables', url: `/org/${slug}/project/${ref}/database/tables`, items: [] },
        {
          name: 'Functions',
          key: 'functions',
          url: `/org/${slug}/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/org/${slug}/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: 'Enumerated Types',
          key: 'types',
          url: `/org/${slug}/project/${ref}/database/types`,

          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/org/${slug}/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: 'Indexes',
          key: 'indexes',
          url: `/org/${slug}/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: 'Publications',
          key: 'publications',
          url: `/org/${slug}/project/${ref}/database/publications`,
          items: [],
        },
        ...(enablePgReplicate
          ? [
              {
                name: 'Replication',
                key: 'replication',
                url: `/org/${slug}/project/${ref}/database/replication`,
                items: [],
              },
            ]
          : [
              {
                name: 'Replication',
                key: 'replication',
                url: `/org/${slug}/project/${ref}/database/replication`,
                label: 'Coming Soon',
                items: [],
              },
            ]),
      ],
    },
    {
      title: 'Access Control',
      items: [
        { name: 'Roles', key: 'roles', url: `/org/${slug}/project/${ref}/database/roles`, items: [] },
        ...(columnLevelPrivileges
          ? [
              {
                name: 'Column Privileges',
                key: 'column-privileges',
                url: `/org/${slug}/project/${ref}/database/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        {
          name: 'Policies',
          key: 'policies',
          url: `/org/${slug}/project/${ref}/auth/policies`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        { // FIXME: Backups are only enabled for now
          name: 'Backups',
          key: 'backups',
          url: pitrEnabled
            ? `/org/${slug}/project/${ref}/database/backups/pitr`
            : `/org/${slug}/project/${ref}/database/backups/scheduled`,
          items: [],
        },
        {
          name: 'Migrations',
          key: 'migrations',
          url: `/org/${slug}/project/${ref}/database/migrations`,
          items: [],
        },
        {
          name: 'Wrappers',
          key: 'wrappers',
          url: `/org/${slug}/project/${ref}/integrations?category=wrapper`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        ...(!!pgNetExtensionExists
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/org/${slug}/project/${ref}/integrations/webhooks/overview`,
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
          url: `/org/${slug}/project/${ref}/advisors/security`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: 'Performance Advisor',
          key: 'performance-advisor',
          url: `/org/${slug}/project/${ref}/advisors/performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/org/${slug}/project/${ref}/advisors/query-performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
