import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const contributingDetails: ContentListingGroup = {
  id: 'contributing-details',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Contributing to Supabase docs',
      href: 'https://github.com/supabase/supabase/blob/master/apps/docs/CONTRIBUTING.md',
      icon: '/docs/img/icons/github-icon',
      description:
        'Learn more about authoring, where our docs source lives, and how the docs app works.',
    },
  ],
}
