import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { docsProductionChecklist: productionChecklistEnabled } = isFeatureEnabled([
  'docs:production_checklist',
])

export const deployment: NavMenuConstant = {
  title: 'Deploy to production',
  icon: 'git-branch',
  url: '/guides/deployment',
  items: [
    {
      name: 'Production checklist',
      url: '/guides/deployment/going-into-prod',
      enabled: productionChecklistEnabled,
    },
    {
      name: 'Shared responsibility model',
      url: '/guides/deployment/shared-responsibility-model',
    },
    { name: 'Maturity model', url: '/guides/deployment/maturity-model' },
    {
      name: 'Environments',
      items: [
        { name: 'Managing environments', url: '/guides/deployment/managing-environments' },
        { name: 'Database migrations', url: '/guides/deployment/database-migrations' },
      ],
    },
    {
      name: 'Branching',
      items: [
        { name: 'Overview', url: '/guides/deployment/branching' },
        { name: 'Branching via GitHub', url: '/guides/deployment/branching/github-integration' },
        { name: 'Branching via dashboard', url: '/guides/deployment/branching/dashboard' },
        {
          name: 'Working with branches',
          url: '/guides/deployment/branching/working-with-branches',
        },
        { name: 'Branching configuration', url: '/guides/deployment/branching/configuration' },
        { name: 'Branching integrations', url: '/guides/deployment/branching/integrations' },
        {
          name: 'Branching troubleshooting',
          url: '/guides/deployment/branching/troubleshooting',
        },
      ],
    },
    {
      name: 'CI/CD',
      items: [
        {
          name: 'Generate types from your database',
          url: '/guides/deployment/ci/generating-types',
        },
        { name: 'Automated testing', url: '/guides/deployment/ci/testing' },
        { name: 'Back up your database', url: '/guides/deployment/ci/backups' },
      ],
    },
    {
      name: 'Terraform',
      items: [
        { name: 'Overview', url: '/guides/deployment/terraform' },
        { name: 'Terraform tutorial', url: '/guides/deployment/terraform/tutorial' },
        { name: 'Terraform reference', url: '/guides/deployment/terraform/reference' },
      ],
    },
  ],
}
