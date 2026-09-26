import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const localDevelopmentParallelProjectsLearnMore: ContentListingGroup = {
  id: 'local-development-parallel-projects-learn-more',
  heading: 'Learn more',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Install and run the CLI',
      href: '/guides/local-development/cli/getting-started',
      description:
        'Install the CLI, switch to the beta channel, and start your first local project.',
    },
    {
      title: 'Local development workflow',
      href: '/guides/local-development/cli-workflows',
      description: 'Day-to-day commands for one local project, from migrations to troubleshooting.',
    },
    {
      title: 'Docker and native runtimes',
      href: '/guides/local-development/docker-and-native-runtimes',
      description:
        'How the CLI picks a runtime, what the native runtime needs, and where it stores data.',
    },
    {
      title: 'Managing config and secrets',
      href: '/guides/local-development/managing-config',
      description:
        'Keep configuration and secrets consistent across local, staging, and production.',
    },
    {
      title: 'CLI configuration',
      href: '/guides/local-development/cli/config',
      description: 'Every key in config.toml, including the experimental stack setting.',
    },
  ],
}

export const localDevelopmentRuntimesLearnMore: ContentListingGroup = {
  id: 'local-development-runtimes-learn-more',
  heading: 'Learn more',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Running multiple local projects',
      href: '/guides/local-development/running-multiple-local-projects',
      description:
        'Run a local project for every app, git worktree, or environment on one machine.',
    },
    {
      title: 'Install and run the CLI',
      href: '/guides/local-development/cli/getting-started',
      description:
        'Install the CLI, switch to the beta channel, and start your first local project.',
    },
    {
      title: 'CLI configuration',
      href: '/guides/local-development/cli/config',
      description: 'Every key in config.toml, including the experimental stack setting.',
    },
  ],
}
