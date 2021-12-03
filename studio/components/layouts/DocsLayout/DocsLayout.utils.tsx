import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IconBook, IconBookOpen } from '@supabase/ui'

export const generateDocsMenu = (
  ref: string,
  tables: string[],
  functions: string[]
): ProductMenuGroup[] => {
  return [
    {
      title: 'Getting Started',
      items: [
        { name: 'Introduction', key: 'introduction', url: `/project/${ref}/api`, items: [] },
        {
          name: 'Authentication',
          key: 'authentication',
          url: `/project/${ref}/api?page=auth`,
          items: [],
        },
        {
          name: 'User Management',
          key: 'user-management',
          url: `/project/${ref}/api?page=users`,
          items: [],
        },
      ],
    },
    {
      title: 'Tables and Views',
      items: [
        {
          name: 'Introduction',
          key: 'tables-introduction',
          url: `/project/${ref}/api?page=tables-intro`,
          items: [],
        },
        ...tables.map((table) => {
          return {
            name: table,
            key: table,
            url: `/project/${ref}/api?resource=${table}`,
            items: [],
          }
        }),
      ],
    },
    {
      title: 'Stored Procedures',
      items: [
        {
          name: 'Introduction',
          key: 'sp-introduction',
          url: `/project/${ref}/api?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `/project/${ref}/api?rpc=${fn}`, items: [] }
        }),
      ],
    },
    {
      title: 'More Resources',
      items: [
        {
          name: 'Guides',
          key: 'guides',
          url: `https://supabase.com/docs`,
          icon: <IconBook size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
        {
          name: 'API Reference',
          key: 'api-reference',
          url: `https://supabase.com/docs/client/supabase-client`,
          icon: <IconBookOpen size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
      ],
    },
  ]
}
