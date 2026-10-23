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
      badge: 'Official',
    },
  ],
}

export const selfHostingCommunity: ContentListingGroup = {
  id: 'self-hosting-community',
  heading: 'Community projects',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  description:
    'These projects are maintained by the Supabase community, not by Supabase. To get involved, see the [Community page](https://supabase.com/contribute).',
  items: [
    {
      title: 'Kubernetes',
      href: 'https://github.com/supabase-community/supabase-kubernetes',
      icon: '/docs/img/icons/kubernetes-icon',
      hasLightIcon: false,
      description: 'Run Supabase on Kubernetes with the Supabase Operator or a Helm chart.',
    },
    {
      title: 'Observability',
      href: 'https://github.com/supabase-community/supabase-observability',
      icon: { kind: 'grafana', color: '#F05A28', bg: 'rgba(240,90,40,0.1)' },
      description:
        'Collect logs, metrics, and traces from self-hosted Supabase with open-source tools.',
    },
  ],
}

export const selfHostingThirdPartyGuides: ContentListingGroup = {
  id: 'self-hosting-third-party-guides',
  heading: 'Third-party guides',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  description:
    "Guides written by other projects and companies. Supabase doesn't maintain them, so check that they match your version of self-hosted Supabase.",
  items: [
    {
      title: 'Secure self-hosted Supabase with NetBird',
      href: 'https://netbird.io/knowledge-hub/supabase-self-hosted-netbird',
      icon: { kind: 'server', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
      subtitle: 'By NetBird',
      description:
        'Keep Studio and Postgres off the public internet with NetBird network access controls.',
    },
  ],
}

export const selfHostingSupport: ContentListingGroup = {
  id: 'self-hosting-support',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'GitHub Discussions',
      href: 'https://github.com/orgs/supabase/discussions?discussions_q=is%3Aopen+label%3Aself-hosted',
      icon: '/docs/img/icons/github-icon',
      description: 'Ask questions, resolve common issues, and make feature requests',
    },
    {
      title: 'GitHub Issues',
      href: 'https://github.com/supabase/supabase/issues?q=is%3Aissue%20state%3Aopen%20label%3Aself-hosted',
      icon: '/docs/img/icons/github-icon',
      description: 'Find out about known issues and workarounds',
    },
    {
      title: 'Discord',
      href: 'https://discord.supabase.com',
      icon: '/docs/img/icons/discord-icon',
      hasLightIcon: false,
      description: 'Connect with other users and get help',
    },
    {
      title: 'Reddit',
      href: 'https://www.reddit.com/r/Supabase/',
      icon: '/docs/img/icons/reddit-icon',
      hasLightIcon: false,
      description: 'Join the official Supabase subreddit',
    },
    {
      title: 'Share your experience',
      href: 'https://github.com/orgs/supabase/discussions/39820',
      icon: '/docs/img/icons/github-icon',
      description: 'Share your self-hosting experience',
    },
  ],
}
