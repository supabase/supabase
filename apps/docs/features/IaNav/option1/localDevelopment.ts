import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { docsLocalDevelopment: localDevelopmentEnabled } = isFeatureEnabled([
  'docs:local_development',
])

export const localDevelopment: NavMenuConstant = {
  icon: 'dev-cli',
  title: 'Local Development & CLI',
  url: '/guides/local-development',
  items: [
    { name: 'Install and run the CLI', url: '/guides/local-development/cli/getting-started' },
    { name: 'Local development workflow', url: '/guides/local-development/cli-workflows' },
    {
      name: 'Schemas and migrations',
      items: [
        { name: 'Database migrations', url: '/guides/local-development/database-migrations' },
        {
          name: 'Declarative database schemas',
          url: '/guides/local-development/declarative-database-schemas',
        },
        { name: 'Diff engines', url: '/guides/local-development/diff-engines' },
        { name: 'Seeding your database', url: '/guides/local-development/seeding-your-database' },
        {
          name: 'Restoring downloaded backup',
          url: '/guides/local-development/restoring-downloaded-backup',
          enabled: localDevelopmentEnabled,
        },
        { name: 'Generate TypeScript types', url: '/guides/api/rest/generating-types' },
        { name: 'Generate Python types', url: '/guides/api/rest/generating-python-types' },
      ],
    },
    {
      name: 'Local environment setup',
      items: [
        {
          name: 'Running multiple local projects',
          url: '/guides/local-development/running-multiple-local-projects',
        },
        {
          name: 'Docker and native runtimes',
          url: '/guides/local-development/docker-and-native-runtimes',
        },
        { name: 'Managing config and secrets', url: '/guides/local-development/managing-config' },
        {
          name: 'Customizing email templates',
          url: '/guides/local-development/customizing-email-templates',
          enabled: localDevelopmentEnabled,
        },
      ],
    },
    {
      name: 'CLI reference',
      items: [
        {
          name: 'CLI configuration',
          url: '/guides/local-development/cli/config',
          enabled: localDevelopmentEnabled,
        },
        { name: 'CLI commands', url: '/reference/cli' },
      ],
    },
  ],
}
