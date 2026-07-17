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
  heading: 'Community-driven projects',
  headingLevel: 'h2',
  type: 'grid',
  columns: 2,
  description:
    "There are several other options to deploy Supabase. If you're interested in helping these projects, visit our Community page.",
  items: [
    {
      title: 'Kubernetes',
      href: 'https://github.com/supabase-community/supabase-kubernetes',
      icon: '/docs/img/icons/kubernetes-icon',
      hasLightIcon: false,
      description: 'Helm charts to deploy a Supabase on Kubernetes.',
    },
    {
      title: 'Traefik',
      href: 'https://github.com/supabase-community/supabase-traefik',
      icon: '/docs/img/icons/traefik-icon',
      hasLightIcon: false,
      description: 'A self-hosted Supabase setup with Traefik as a reverse proxy.',
    },
  ],
}

export const selfHostingResolveIssues: ContentListingGroup = {
  id: 'self-hosting-resolve-issues',
  description: 'For resolving common issues:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'GitHub Discussions',
      href: 'https://github.com/orgs/supabase/discussions?discussions_q=is%3Aopen+label%3Aself-hosted',
      icon: '/docs/img/icons/github-icon',
      description: 'Questions, feature requests, and workarounds',
    },
    {
      title: 'GitHub Issues',
      href: 'https://github.com/supabase/supabase/issues?q=is%3Aissue%20state%3Aopen%20label%3Aself-hosted',
      icon: '/docs/img/icons/github-icon',
      description: 'Known issues',
    },
  ],
}

export const selfHostingGetHelp: ContentListingGroup = {
  id: 'self-hosting-get-help',
  description: 'Get help and connect with other users:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Discord',
      href: 'https://discord.supabase.com',
      icon: '/docs/img/icons/discord-icon',
      hasLightIcon: false,
      description: 'Real-time chat and community support',
    },
    {
      title: 'Reddit',
      href: 'https://www.reddit.com/r/Supabase/',
      icon: '/docs/img/icons/reddit-icon',
      hasLightIcon: false,
      description: 'Official Supabase subreddit',
    },
  ],
}

export const selfHostingShareExperience: ContentListingGroup = {
  id: 'self-hosting-share-experience',
  description: 'Share your self-hosting experience:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'GitHub Discussions',
      href: 'https://github.com/orgs/supabase/discussions/39820',
      icon: '/docs/img/icons/github-icon',
      description: "Self-hosting: What's working (and what's not)?",
    },
  ],
}
