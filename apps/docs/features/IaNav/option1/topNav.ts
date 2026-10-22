import { isFeatureEnabled } from 'common/enabled-features'

import type { GlobalMenuItems } from '@/components/Navigation/Navigation.types'

const {
  billingAll: billingEnabled,
  docsContribution: contributionEnabled,
  docsFrameworkQuickstarts: frameworkQuickstartsEnabled,
  'docsSelf-hosting': selfHostingEnabled,
  integrationsPartners: integrationsEnabled,
  sdkCsharp: sdkCsharpEnabled,
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkPython: sdkPythonEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled([
  'billing:all',
  'docs:contribution',
  'docs:framework_quickstarts',
  'docs:self-hosting',
  'integrations:partners',
  'sdk:csharp',
  'sdk:dart',
  'sdk:kotlin',
  'sdk:python',
  'sdk:swift',
])

export const GLOBAL_MENU_ITEMS: GlobalMenuItems = [
  [
    {
      label: 'Start',
      icon: 'getting-started',
      href: '/guides/getting-started',
      level: 'gettingstarted',
      enabled: frameworkQuickstartsEnabled,
    },
  ],
  [
    {
      label: 'Build',
      menuItems: [
        [
          {
            label: 'Database',
            icon: 'database',
            href: '/guides/database/overview',
            level: 'database',
          },
          { label: 'Auth', icon: 'auth', href: '/guides/auth', level: 'auth' },
          { label: 'Storage', icon: 'storage', href: '/guides/storage', level: 'storage' },
          {
            label: 'Edge Functions',
            icon: 'edge-functions',
            href: '/guides/functions',
            level: 'functions',
          },
          {
            label: 'REST, GraphQL and Realtime APIs',
            icon: 'rest',
            href: '/guides/api',
            level: 'api',
          },
          { label: 'AI and Vectors', icon: 'ai', href: '/guides/ai', level: 'ai' },
          { label: 'Cron and Queues', icon: 'cron', href: '/guides/cron', level: 'cron' },
        ],
      ],
    },
  ],
  [
    {
      label: 'Develop and deploy',
      menuItems: [
        [
          { label: 'AI tools', icon: 'ai-tools', href: '/guides/ai-tools', level: 'ai_tools' },
          {
            label: 'Local Development and CLI',
            icon: 'dev-cli',
            href: '/guides/local-development',
            level: 'local_development',
          },
          {
            label: 'Integrations',
            icon: 'integrations',
            hasLightIcon: true,
            href: '/guides/integrations',
            level: 'integrations',
            enabled: integrationsEnabled,
          },
          {
            label: 'Deploy to production',
            icon: 'git-branch',
            href: '/guides/deployment',
            level: 'deployment',
          },
          {
            label: 'Terraform',
            icon: 'deployment',
            href: '/guides/deployment/terraform',
            level: 'deployment',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Run and manage',
      menuItems: [
        [
          {
            label: 'Projects, compute and scaling',
            icon: 'platform',
            href: '/guides/platform/performance',
            level: 'platform',
          },
          {
            label: 'Network, SSL and domains',
            icon: 'platform',
            href: '/guides/platform/ssl-enforcement',
            level: 'platform',
          },
          {
            label: 'Team',
            icon: 'platform',
            href: '/guides/platform/access-control',
            level: 'platform',
          },
          {
            label: 'Security and compliance',
            icon: 'security',
            href: '/guides/security/platform-security',
            level: 'security',
          },
          {
            label: 'Backups, restore and upgrades',
            icon: 'database',
            href: '/guides/platform/backups',
            level: 'platform',
          },
          {
            label: 'Billing and usage',
            icon: 'platform',
            href: '/guides/platform/get-set-up-for-billing',
            level: 'platform',
            enabled: billingEnabled,
          },
          {
            label: 'Logs and monitoring',
            icon: 'telemetry',
            href: '/guides/observability/logs',
            level: 'telemetry',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Self-Hosting',
      icon: 'self-hosting',
      href: '/guides/self-hosting',
      level: 'self_hosting',
      enabled: selfHostingEnabled,
    },
  ],
  [
    {
      label: 'Reference',
      menuItems: [
        [
          { label: 'Client libraries' },
          {
            label: 'JavaScript',
            icon: 'reference-javascript',
            href: '/reference/javascript',
            level: 'reference_javascript',
          },
          {
            label: 'Flutter',
            icon: 'reference-dart',
            href: '/reference/dart',
            level: 'reference_dart',
            enabled: sdkDartEnabled,
          },
          {
            label: 'Swift',
            icon: 'reference-swift',
            href: '/reference/swift',
            level: 'reference_swift',
            enabled: sdkSwiftEnabled,
          },
          {
            label: 'Python',
            icon: 'reference-python',
            href: '/reference/python',
            level: 'reference_python',
            enabled: sdkPythonEnabled,
          },
          {
            label: 'C#',
            icon: 'reference-csharp',
            href: '/reference/csharp',
            level: 'reference_csharp',
            enabled: sdkCsharpEnabled,
          },
          {
            label: 'Kotlin',
            icon: 'reference-kotlin',
            href: '/reference/kotlin',
            level: 'reference_kotlin',
            community: true,
            enabled: sdkKotlinEnabled,
          },
        ],
        [
          {
            label: 'CLI Commands',
            icon: 'reference-cli',
            href: '/reference/cli/introduction',
            level: 'reference_javascript',
          },
          {
            label: 'Management API',
            icon: 'reference-api',
            href: '/reference/api/introduction',
            level: 'reference_javascript',
          },
          { label: 'UI Library', icon: 'ui', href: 'https://supabase.com/library', level: 'ui' },
        ],
      ],
    },
  ],
  [
    {
      label: 'Resources',
      menuItems: [
        [
          {
            label: 'Glossary',
            icon: 'resources',
            href: '/guides/resources/glossary',
            level: 'resources',
          },
          {
            label: 'Changelog',
            icon: 'changelog',
            hasLightIcon: true,
            href: 'https://supabase.com/changelog',
            level: 'changelog',
          },
          { label: 'Status', icon: 'status', href: 'https://status.supabase.com/' },
          {
            label: 'Contributing',
            icon: 'contributing',
            href: '/contributing',
            enabled: contributionEnabled,
          },
          {
            label: 'Troubleshooting',
            icon: 'troubleshooting',
            href: '/guides/troubleshooting',
            level: 'troubleshooting',
          },
        ],
      ],
    },
  ],
]
