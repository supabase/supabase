import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

export const selfHosting: NavMenuConstant = {
  title: 'Self-Hosting',
  icon: 'self-hosting',
  url: '/guides/self-hosting',
  items: [
    { name: 'Deploy with Docker', url: '/guides/self-hosting/docker' },
    {
      name: 'Keys, gateway, HTTPS, and Postgres',
      items: [
        { name: 'Accessing Postgres', url: '/guides/self-hosting/accessing-postgres' },
        { name: 'Configure new API keys', url: '/guides/self-hosting/self-hosted-auth-keys' },
        { name: 'Learn about API Gateway', url: '/guides/self-hosting/self-hosted-envoy' },
        {
          name: 'Add Reverse Proxy with HTTPS',
          url: '/guides/self-hosting/self-hosted-proxy-https',
        },
        { name: 'Remove superuser access', url: '/guides/self-hosting/remove-superuser-access' },
      ],
    },
    {
      name: 'Update and upgrade',
      items: [
        { name: 'Update your deployment', url: '/guides/self-hosting/updating' },
        { name: 'Upgrade to Postgres 17', url: '/guides/self-hosting/postgres-upgrade-17' },
      ],
    },
    {
      name: 'Configure Auth',
      items: [
        { name: 'Configure Social Sign-in (OAuth)', url: '/guides/self-hosting/self-hosted-oauth' },
        {
          name: 'Configure Custom OAuth/OIDC',
          url: '/guides/self-hosting/self-hosted-custom-oauth-providers',
        },
        {
          name: 'Configure Phone Sign-in & MFA',
          url: '/guides/self-hosting/self-hosted-phone-mfa',
        },
        { name: 'Add Custom Email Templates', url: '/guides/self-hosting/custom-email-templates' },
        { name: 'Configure Auth Hooks', url: '/guides/self-hosting/self-hosted-auth-hooks' },
        { name: 'Configure Passkeys', url: '/guides/self-hosting/self-hosted-passkeys' },
        { name: 'Configure SAML 2.0 SSO', url: '/guides/self-hosting/self-hosted-saml-sso' },
      ],
    },
    {
      name: 'Functions, Storage, MCP, extensions',
      items: [
        { name: 'Run Self-Hosted Functions', url: '/guides/self-hosting/self-hosted-functions' },
        { name: 'Configure S3 Storage', url: '/guides/self-hosting/self-hosted-s3' },
        { name: 'Enable MCP server', url: '/guides/self-hosting/enable-mcp' },
        {
          name: 'Build Custom Extensions',
          url: '/guides/self-hosting/custom-postgres-extensions',
        },
      ],
    },
    {
      name: 'Move from Supabase Cloud',
      items: [
        {
          name: 'Restore Project from Platform',
          url: '/guides/self-hosting/restore-from-platform',
        },
        { name: 'Copy Storage from Platform', url: '/guides/self-hosting/copy-from-platform-s3' },
      ],
    },
    {
      name: 'Service reference and config',
      items: [
        {
          name: 'Auth Server',
          items: [
            { name: 'Auth Server reference', url: '/reference/self-hosting-auth/introduction' },
            { name: 'Auth Server configuration', url: '/guides/self-hosting/auth/config' },
          ],
        },
        {
          name: 'Storage Server',
          items: [
            {
              name: 'Storage Server reference',
              url: '/reference/self-hosting-storage/introduction',
            },
            { name: 'Storage Server configuration', url: '/guides/self-hosting/storage/config' },
          ],
        },
        {
          name: 'Realtime Server',
          items: [
            {
              name: 'Realtime Server reference',
              url: '/reference/self-hosting-realtime/introduction',
            },
            { name: 'Realtime Server configuration', url: '/guides/self-hosting/realtime/config' },
          ],
        },
        {
          name: 'Analytics Server',
          items: [
            {
              name: 'Analytics Server reference',
              url: '/reference/self-hosting-analytics/introduction',
            },
            {
              name: 'Analytics Server configuration',
              url: '/guides/self-hosting/analytics/config',
            },
          ],
        },
        {
          name: 'Functions Server reference',
          url: '/reference/self-hosting-functions/introduction',
        },
      ],
    },
  ],
}
