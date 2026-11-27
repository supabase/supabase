import { EXAMPLES } from '@/data/registry'
import { EXAMPLE_CATEGORIES, SUPABASE_FEATURES } from '@/data/types'
import { withBasePath } from '@/lib/base-path'
import { usedCategories, usedFeatures } from '@/lib/filter-examples'

interface NavLink {
  label: string
  href: string
}

interface NavLinkGroup {
  label: string
  links: NavLink[]
}

export interface NavMenu {
  label: string
  groups: NavLinkGroup[]
}

// Same menu shape as apps/kb/src/lib/nav.ts
export const getNavMenus = (): NavMenu[] => [
  {
    label: 'Examples',
    groups: [
      {
        label: 'By category',
        links: usedCategories(EXAMPLES).map((category) => ({
          label: EXAMPLE_CATEGORIES[category],
          href: withBasePath(`/?category=${category}`),
        })),
      },
      {
        label: 'By feature',
        links: usedFeatures(EXAMPLES).map((feature) => ({
          label: SUPABASE_FEATURES[feature].label,
          href: withBasePath(`/?features=${feature}`),
        })),
      },
    ],
  },
  {
    label: 'Resources',
    groups: [
      {
        label: 'Resources',
        links: [
          { label: 'Status', href: 'https://status.supabase.com' },
          { label: 'Changelog', href: 'https://supabase.com/changelog' },
          { label: 'Docs', href: 'https://supabase.com/docs' },
        ],
      },
    ],
  },
]
