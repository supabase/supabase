import { ArrowUpRight, Book, BookOpen } from 'lucide-react'
import SVG from 'react-inlinesvg'

import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'

export const getActivePage = (params: {
  page?: string
  resource?: string
  rpc?: string
}): string => {
  const { page, resource, rpc } = params
  if (!page && !resource && !rpc) return 'introduction'
  return (page || rpc || resource) as string
}

export const generateDocsMenu = (
  ref: string,
  tables: Array<string>,
  functions: Array<string>,
  flags?: { authEnabled: boolean },
  basePath?: string
): Array<ProductMenuGroup> => {
  const docsBasePath = basePath ?? `/project/${ref}/integrations/data_api/docs`

  return [
    {
      title: 'Getting Started',
      items: [
        { name: 'Introduction', key: 'introduction', url: docsBasePath, items: [] },
        {
          name: 'Authentication',
          key: 'auth',
          url: `${docsBasePath}?page=auth`,
          items: [],
        },
        ...(flags?.authEnabled
          ? [
              {
                name: 'User Management',
                key: 'users-management',
                url: `${docsBasePath}?page=users-management`,
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
          url: `${docsBasePath}?page=tables-intro`,
          items: [],
        },
        ...tables.sort().map((table) => {
          return {
            name: table,
            key: table,
            url: `${docsBasePath}?resource=${table}`,
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
          url: `${docsBasePath}?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `${docsBasePath}?rpc=${fn}`, items: [] }
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
          url: DOCS_URL,
          icon: <Book size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
        {
          name: 'API Reference',
          key: 'api-reference',
          url: `${DOCS_URL}/guides/api`,
          icon: <BookOpen size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
      ],
    },
  ]
}
