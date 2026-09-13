import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'

export function generateIntegrationsMenu({
  projectRef,
  flags,
}: {
  projectRef?: string
  flags?: { showWrappers: boolean }
}): ProductMenuGroup[] {
  const { showWrappers } = flags ?? {}

  return [
    {
      title: 'Explore',
      items: [
        {
          name: 'All',
          key: 'integrations',
          url: `/project/${projectRef}/integrations`,
          pages: ['integrations'],
          items: [],
        },
        ...(showWrappers
          ? [
              {
                name: 'Wrappers',
                key: 'integrations-wrapper',
                url: `/project/${projectRef}/integrations?category=wrapper`,
                pages: ['integrations?category=wrapper'],
                items: [],
              },
            ]
          : []),
        {
          name: 'Postgres Modules',
          key: 'integrations-postgres_extension',
          url: `/project/${projectRef}/integrations?category=postgres_extension`,
          pages: ['integrations?category=postgres_extension'],
          items: [],
        },
      ],
    },
  ]
}
