import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { BASE_PATH } from 'lib/constants'
import { ArrowUpRight, Book, BookOpen } from 'lucide-react'
import SVG from 'react-inlinesvg'

export const generateDocsMenu = (
  ref: string,
  tables: string[],
  functions: string[],
  flags?: { authEnabled: boolean }
): ProductMenuGroup[] => {
  return [
    {
      title: 'Getting Started',
      items: [
        { name: 'Introduction', key: 'introduction', url: `/project/${ref}/api`, items: [] },
        {
          name: 'Authentication',
          key: 'auth',
          url: `/project/${ref}/api?page=auth`,
          items: [],
        },
        ...(flags?.authEnabled
          ? [
              {
                name: 'User Management',
                key: 'users',
                url: `/project/${ref}/api?page=users`,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: 'Tables and Views',
      items: [
        {
          name: 'Introduction',
          key: 'tables-intro',
          url: `/project/${ref}/api?page=tables-intro`,
          items: [],
        },
        ...tables.sort().map((table) => {
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
          key: 'rpc-intro',
          url: `/project/${ref}/api?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `/project/${ref}/api?rpc=${fn}`, items: [] }
        }),
      ],
    },
    {
      title: 'GraphQL',
      items: [
        {
          name: 'GraphiQL',
          key: 'graphiql',
          url: `/project/${ref}/integrations/graphiql`,
          icon: (
            <SVG
              src={`${BASE_PATH}/img/graphql.svg`}
              style={{ width: `${16}px`, height: `${16}px` }}
              className="text-foreground"
              preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
            />
          ),
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'More Resources',
      items: [
        {
          name: 'Guides',
          key: 'guides',
          url: `https://supabase.com/docs`,
          icon: <Book size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
        {
          name: 'API Reference',
          key: 'api-reference',
          url: `https://supabase.com/docs/guides/api`,
          icon: <BookOpen size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
      ],
    },
  ]
}
