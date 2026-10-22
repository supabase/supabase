import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const {
  billingAll: billingEnabled,
  docsCompliance: complianceEnabled,
  docsFullPlatform: fullPlatformEnabled,
} = isFeatureEnabled(['billing:all', 'docs:compliance', 'docs:full_platform'])

export const runAndManage: NavMenuConstant = {
  icon: 'platform',
  title: 'Run and manage',
  url: '/guides/platform',
  items: [
    {
      name: 'Projects, compute and scaling',
      items: [
        {
          name: 'Compute and Disk',
          url: '/guides/platform/compute-and-disk',
          enabled: fullPlatformEnabled,
        },
        {
          name: 'Database and disk size',
          url: '/guides/platform/database-size',
          enabled: fullPlatformEnabled,
        },
        { name: 'Performance Tuning', url: '/guides/platform/performance' },
        { name: 'Regions', url: '/guides/platform/regions' },
        {
          name: 'Transfer, pause or delete a project',
          items: [
            {
              name: 'Transfer Project',
              url: '/guides/platform/project-transfer',
              enabled: fullPlatformEnabled,
            },
            { name: 'Project Pausing', url: '/guides/platform/free-project-pausing' },
            { name: 'Delete Project', url: '/guides/platform/delete-project' },
          ],
        },
      ],
    },
    {
      name: 'Network, SSL and domains',
      items: [
        { name: 'SSL enforcement', url: '/guides/platform/ssl-enforcement' },
        {
          name: 'Network restrictions (IP allowlist)',
          url: '/guides/platform/network-restrictions',
        },
        { name: 'PrivateLink', url: '/guides/platform/privatelink' },
        { name: 'Dedicated IPv4 address', url: '/guides/platform/ipv4-address' },
        { name: 'Custom Domains', url: '/guides/platform/custom-domains' },
      ],
    },
    {
      name: 'Team',
      items: [
        { name: 'Roles and permissions', url: '/guides/platform/access-control' },
        {
          name: 'Single sign-on (SSO)',
          enabled: fullPlatformEnabled,
          items: [
            { name: 'Overview', url: '/guides/platform/sso' },
            {
              name: 'Login flows',
              items: [
                { name: 'Understanding Login Flows', url: '/guides/platform/sso/login-flows' },
                { name: 'Choosing a Login Flow', url: '/guides/platform/sso/choosing-login-flow' },
              ],
            },
            { name: 'SSO with Azure AD', url: '/guides/platform/sso/azure' },
            { name: 'SSO with Google Workspace', url: '/guides/platform/sso/gsuite' },
            { name: 'SSO with Okta', url: '/guides/platform/sso/okta' },
            { name: 'Multiple SSO Providers', url: '/guides/platform/sso/multiple-providers' },
            {
              name: 'Testing and Best Practices',
              url: '/guides/platform/sso/testing-best-practices',
            },
            {
              name: 'Enterprise-managed auth for MCP',
              url: '/guides/platform/sso/enterprise-mcp-authentication',
            },
          ],
        },
        {
          name: 'Multi-factor authentication (MFA)',
          enabled: fullPlatformEnabled,
          items: [
            { name: 'Overview', url: '/guides/platform/multi-factor-authentication' },
            {
              name: 'Enforce MFA on organization',
              url: '/guides/platform/mfa/org-mfa-enforcement',
            },
          ],
        },
        {
          name: 'Personal Access Tokens',
          url: '/guides/platform/personal-access-tokens',
          enabled: fullPlatformEnabled,
        },
        { name: 'Audit logs (team activity)', url: '/guides/security/platform-audit-logs' },
        {
          name: 'Map team members to Postgres roles',
          url: '/guides/platform/temporary-access#configure-user-access',
        },
      ],
    },
    {
      name: 'Security and compliance',
      items: [
        {
          name: 'Compliance: SOC 2, HIPAA, GDPR',
          enabled: complianceEnabled,
          items: [
            { name: 'SOC 2 compliance', url: '/guides/security/soc-2-compliance' },
            {
              name: 'HIPAA compliance',
              items: [
                { name: 'Overview', url: '/guides/security/hipaa-compliance' },
                { name: 'HIPAA Projects', url: '/guides/platform/hipaa-projects' },
              ],
            },
            { name: 'GDPR compliance', url: '/guides/security/gdpr-compliance' },
          ],
        },
        { name: 'Secure platform configuration', url: '/guides/security/platform-security' },
        { name: 'Secure product configuration', url: '/guides/security/product-security' },
        { name: 'Security testing', url: '/guides/security/security-testing' },
        { name: 'Securing your npm installs', url: '/guides/security/npm-security' },
        {
          name: 'Rotate a leaked API key',
          url: '/guides/getting-started/api-keys#leaked-key',
        },
        {
          name: 'Production security checklist',
          url: '/guides/deployment/going-into-prod#security',
        },
      ],
    },
    {
      name: 'Backups, restore and upgrades',
      items: [
        { name: 'Database Backups', url: '/guides/platform/backups' },
        { name: 'Restore to a new project', url: '/guides/platform/clone-project' },
        {
          name: 'Upgrading Postgres',
          url: '/guides/platform/upgrading',
          enabled: fullPlatformEnabled,
        },
        {
          name: 'Migrating within Supabase',
          enabled: fullPlatformEnabled,
          items: [
            { name: 'Overview', url: '/guides/platform/migrating-within-supabase' },
            {
              name: 'Restore Dashboard backup',
              url: '/guides/platform/migrating-within-supabase/dashboard-restore',
            },
            {
              name: 'Backup and restore using CLI',
              url: '/guides/platform/migrating-within-supabase/backup-restore',
            },
          ],
        },
      ],
    },
    {
      name: 'Billing and usage',
      enabled: billingEnabled,
      items: [
        { name: 'Get set up for billing', url: '/guides/platform/get-set-up-for-billing' },
        { name: 'Manage your subscription', url: '/guides/platform/manage-your-subscription' },
        {
          name: 'Manage your usage',
          items: [
            { name: 'Overview', url: '/guides/platform/manage-your-usage' },
            {
              name: 'Compute and disk',
              items: [
                { name: 'Compute', url: '/guides/platform/manage-your-usage/compute' },
                { name: 'Disk Size', url: '/guides/platform/manage-your-usage/disk-size' },
                {
                  name: 'Disk Throughput',
                  url: '/guides/platform/manage-your-usage/disk-throughput',
                },
                { name: 'Disk IOPS', url: '/guides/platform/manage-your-usage/disk-iops' },
              ],
            },
            {
              name: 'Egress, IPv4 and domains',
              items: [
                { name: 'Egress', url: '/guides/platform/manage-your-usage/egress' },
                { name: 'IPv4', url: '/guides/platform/manage-your-usage/ipv4' },
                {
                  name: 'Custom Domains',
                  url: '/guides/platform/manage-your-usage/custom-domains',
                },
              ],
            },
            {
              name: 'Auth users and MFA',
              items: [
                {
                  name: 'Monthly Active Users',
                  url: '/guides/platform/manage-your-usage/monthly-active-users',
                },
                {
                  name: 'Monthly Active Third-Party Users',
                  url: '/guides/platform/manage-your-usage/monthly-active-users-third-party',
                },
                {
                  name: 'Monthly Active SSO Users',
                  url: '/guides/platform/manage-your-usage/monthly-active-users-sso',
                },
                {
                  name: 'MFA Phone',
                  url: '/guides/platform/manage-your-usage/advanced-mfa-phone',
                },
              ],
            },
            {
              name: 'Storage',
              items: [
                { name: 'Storage Size', url: '/guides/platform/manage-your-usage/storage-size' },
                {
                  name: 'Storage Image Transformations',
                  url: '/guides/platform/manage-your-usage/storage-image-transformations',
                },
              ],
            },
            {
              name: 'Edge Functions and Realtime',
              items: [
                {
                  name: 'Edge Function Invocations',
                  url: '/guides/platform/manage-your-usage/edge-function-invocations',
                },
                {
                  name: 'Realtime Messages',
                  url: '/guides/platform/manage-your-usage/realtime-messages',
                },
                {
                  name: 'Realtime Peak Connections',
                  url: '/guides/platform/manage-your-usage/realtime-peak-connections',
                },
              ],
            },
            {
              name: 'Logs',
              items: [
                { name: 'Logs', url: '/guides/platform/manage-your-usage/logs' },
                { name: 'Logs Ingest', url: '/guides/platform/manage-your-usage/logs-ingest' },
                { name: 'Logs Query', url: '/guides/platform/manage-your-usage/logs-query' },
                { name: 'Log Drains', url: '/guides/platform/manage-your-usage/log-drains' },
              ],
            },
            {
              name: 'Branching, PITR, and replication',
              items: [
                { name: 'Branching', url: '/guides/platform/manage-your-usage/branching' },
                {
                  name: 'Point-in-Time Recovery',
                  url: '/guides/platform/manage-your-usage/point-in-time-recovery',
                },
                { name: 'Read Replicas', url: '/guides/platform/manage-your-usage/read-replicas' },
                { name: 'Pipelines', url: '/guides/platform/manage-your-usage/pipelines' },
              ],
            },
          ],
        },
        {
          name: 'Your monthly invoice and credits',
          items: [
            { name: 'Overview', url: '/guides/platform/your-monthly-invoice' },
            { name: 'Credits', url: '/guides/platform/credits' },
          ],
        },
        { name: 'Control your costs', url: '/guides/platform/cost-control' },
        {
          name: 'AWS Marketplace',
          items: [
            { name: 'Overview', url: '/guides/platform/aws-marketplace' },
            { name: 'Getting Started', url: '/guides/platform/aws-marketplace/getting-started' },
            { name: 'Account Setup', url: '/guides/platform/aws-marketplace/account-setup' },
            {
              name: 'Manage your AWS subscription',
              url: '/guides/platform/aws-marketplace/manage-your-subscription',
            },
            { name: 'AWS invoices', url: '/guides/platform/aws-marketplace/invoices' },
            { name: 'AWS Marketplace FAQ', url: '/guides/platform/aws-marketplace/faq' },
          ],
        },
        { name: 'Billing FAQ', url: '/guides/platform/billing-faq' },
      ],
    },
    {
      name: 'Logs and monitoring',
      items: [
        {
          name: 'Logs',
          items: [
            { name: 'Logs in Studio', url: '/guides/observability/logs' },
            { name: 'Query logs with SQL', url: '/guides/observability/advanced-log-filtering' },
            { name: 'Log sources and fields', url: '/guides/observability/log-field-reference' },
            { name: 'Configure logging', url: '/guides/observability/configure-logging' },
            { name: 'Log drains', url: '/guides/observability/log-drains' },
            {
              name: 'Postgres Connection Logging',
              url: '/guides/platform/postgres-connection-logging',
            },
            {
              name: 'Log slow and failing queries',
              url: '/guides/database/postgres/postgres-log-config#logmindurationstatement',
            },
          ],
        },
        {
          name: 'Metrics API',
          items: [
            { name: 'Overview', url: '/guides/observability/metrics' },
            { name: 'Grafana Cloud', url: '/guides/observability/metrics/grafana-cloud' },
            {
              name: 'Grafana self-hosted',
              url: '/guides/observability/metrics/grafana-self-hosted',
            },
            { name: 'Datadog', url: 'https://docs.datadoghq.com/integrations/supabase/' },
            { name: 'Elastic', url: 'https://www.elastic.co/docs/reference/integrations/supabase' },
            { name: 'Vendor-agnostic setup', url: '/guides/observability/metrics/vendor-agnostic' },
          ],
        },
        { name: 'Reports', url: '/guides/observability/reports' },
        {
          name: 'Advisors and health checks',
          items: [
            { name: 'Advisors', url: '/guides/observability/advisors' },
            { name: 'Detection checks', url: '/guides/observability/detecting' },
          ],
        },
        {
          name: 'Agent prompts',
          items: [
            { name: 'Overview', url: '/guides/observability/automate-with-agents' },
            { name: 'Health prompt', url: '/guides/observability/automate-with-agents/health' },
            { name: 'Security prompt', url: '/guides/observability/automate-with-agents/security' },
            {
              name: 'Performance prompt',
              url: '/guides/observability/automate-with-agents/performance',
            },
            { name: 'Resources prompt', url: '/guides/observability/automate-with-agents/usage' },
          ],
        },
        {
          name: 'Tracing and error monitoring',
          items: [
            { name: 'Client-side tracing', url: '/guides/observability/client-side-tracing' },
            { name: 'Sentry integration', url: '/guides/observability/sentry-monitoring' },
          ],
        },
        {
          name: 'Platform Webhooks',
          enabled: fullPlatformEnabled,
          items: [
            { name: 'Overview', url: '/guides/platform/webhooks' },
            { name: 'Webhook events', url: '/guides/platform/webhooks/events' },
          ],
        },
      ],
    },
  ],
}
