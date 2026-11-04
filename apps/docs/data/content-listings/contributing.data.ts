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
        'Get started in GitHub with our docs source, agent skills for docs authoring, and style guide.',
    },
  ],
}
