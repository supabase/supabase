import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const selfHostingGetStarted: ContentListingGroup = {
  id: 'self-hosting-get-started',
  heading: 'Get started',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  description: 'The fastest and recommended way to self-host Supabase is to use Docker.',
  items: [
    {
      title: 'Docker',
      href: '/guides/self-hosting/docker',
      icon: '/docs/img/icons/docker',
      description: 'Deploy Supabase within your own infrastructure using Docker Compose.',
    },
  ],
}

export const selfHostingCommunity: ContentListingGroup = {
  id: 'self-hosting-community',
  heading: 'Community-driven projects',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Kubernetes',
      href: 'https://github.com/supabase-community/supabase-kubernetes',
      description: 'Helm charts to deploy a Supabase on Kubernetes.',
    },
    {
      title: 'Traefik',
      href: 'https://github.com/supabase-community/supabase-traefik',
      description: 'A self-hosted Supabase setup with Traefik as a reverse proxy.',
    },
  ],
}
