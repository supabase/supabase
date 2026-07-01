import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const cliResources: ContentListingGroup = {
  id: 'cli-resources',
  heading: 'Resources',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Supabase CLI',
      href: 'https://github.com/supabase/cli',
      icon: '/docs/img/icons/github-icon',
      description:
        'The Supabase CLI provides tools to develop manage your Supabase projects from your local machine.',
    },
    {
      title: 'GitHub Action',
      href: 'https://github.com/supabase/setup-cli',
      icon: '/docs/img/icons/github-icon',
      description: 'A GitHub action for interacting with your Supabase projects using the CLI.',
    },
  ],
}
