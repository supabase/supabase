import { useParams } from 'common'
import type {
  ProductMenuGroup,
  ProductMenuGroupItem,
} from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

export const generateDatabaseMenu = (
  ref: string,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
  }
): ProductMenuGroup[] => {
  const { pgNetExtensionExists, pitrEnabled, columnLevelPrivileges } = flags || {}
  return [
    {
      title: 'Postgres Items',
      name: 'Postgres Items',
      key: 'postgres-items',
      link: `/project/${ref}/database/tables`,
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
      title: 'Access Control',
      name: 'Access Control',
      key: 'access-control',
      link: `/project/${ref}/database/policies`,
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
      title: 'Backups',
      name: 'Backups',
      key: 'platform',
      link: `/project/${ref}/database/backups`,
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
      ],
    },
    // {
    //   title: 'Tools',
    //   name: 'Tools',
    //   key: 'tools',
    //   link: `/project/${ref}/advisors/security`,
    //   items: [
    //     {
    //       name: 'Security Advisor',
    //       key: 'security-advisor',
    //       url: `/project/${ref}/advisors/security`,
    //       rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    //       items: [],
    //     },
    //     {
    //       name: 'Performance Advisor',
    //       key: 'performance-advisor',
    //       url: `/project/${ref}/advisors/performance`,
    //       rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    //       items: [],
    //     },
    //     {
    //       name: 'Query Performance',
    //       key: 'query-performance',
    //       url: `/project/${ref}/advisors/query-performance`,
    //       rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    //       items: [],
    //     },
    //   ],
    // },
  ]
}

export const generatePostgresItemsMenu = (
  ref: string,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
  }
): ProductMenuGroupItem[] => {
  const { pgNetExtensionExists, pitrEnabled, columnLevelPrivileges } = flags || {}
  return [
    {
      name: 'Schema Visualizer',
      key: 'schemas',
      url: `/project/${ref}/database/schemas`,
    },
    { name: 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
    {
      name: 'Functions',
      key: 'functions',
      url: `/project/${ref}/database/functions`,
    },
    {
      name: 'Triggers',
      key: 'triggers',
      url: `/project/${ref}/database/triggers`,
    },
    {
      name: 'Enumerated Types',
      key: 'types',
      url: `/project/${ref}/database/types`,
    },
    {
      name: 'Extensions',
      key: 'extensions',
      url: `/project/${ref}/database/extensions`,
    },
    {
      name: 'Indexes',
      key: 'indexes',
      url: `/project/${ref}/database/indexes`,
    },
    {
      name: 'Publications',
      key: 'publications',
      url: `/project/${ref}/database/publications`,
    },
    {
      name: 'Migrations',
      key: 'migrations',
      url: `/project/${ref}/database/migrations`,
    },
    {
      name: 'Wrappers',
      key: 'wrappers',
      url: `/project/${ref}/integrations?category=wrapper`,
      rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    },
    // ...(!!pgNetExtensionExists
    //   ? [
    {
      name: 'Webhooks',
      key: 'hooks',
      url: `/project/${ref}/integrations/webhooks/overview`,
      rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
      items: [],
    },
    //   ]
    // : []),
  ]
}
