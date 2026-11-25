import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'
import { SocialSignInItems } from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

const {
  authenticationShowProviders: allAuthProvidersEnabled,
  docsAuthArchitecture: authArchitectureEnabled,
  docsAuthConfiguration: authConfigurationEnabled,
  docsAuthFlows: authFlowsEnabled,
  docsAuthFullSecurity: authFullSecurityEnabled,
  docsFrameworkQuickstarts: frameworkQuickstartsEnabled,
} = isFeatureEnabled([
  'authentication:show_providers',
  'docs:auth_architecture',
  'docs:auth_configuration',
  'docs:auth_flows',
  'docs:auth_full_security',
  'docs:framework_quickstarts',
])

export const auth: NavMenuConstant = {
  icon: 'auth',
  title: 'Auth',
  url: '/guides/auth',
  items: [
    {
      name: 'Get started and server-side',
      items: [
        {
          name: 'Quickstarts',
          enabled: frameworkQuickstartsEnabled,
          items: [
            { name: 'Next.js', url: '/guides/auth/quickstarts/nextjs' },
            { name: 'Astro', url: '/guides/auth/quickstarts/astrojs' },
            { name: 'React', url: '/guides/auth/quickstarts/react' },
            { name: 'React Native', url: '/guides/auth/quickstarts/react-native' },
            {
              name: 'Expo social sign-in',
              url: '/guides/auth/quickstarts/with-expo-react-native-social-sign-in',
            },
          ],
        },
        {
          name: 'Which package to use',
          url: '/guides/auth/choosing-a-server-package',
          enabled: authFlowsEnabled,
        },
        { name: 'Server SDK reference', url: '/reference/server' },
        { name: 'Middleware SDK reference', url: '/reference/middleware' },
        {
          name: 'Server-side rendering',
          enabled: authFlowsEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/server-side' },
            { name: 'Creating a client', url: '/guides/auth/server-side/creating-a-client' },
            {
              name: 'Migrating from Auth Helpers',
              url: '/guides/auth/server-side/migrating-to-ssr-from-auth-helpers',
            },
            { name: 'Advanced guide', url: '/guides/auth/server-side/advanced-guide' },
          ],
        },
      ],
    },
    {
      name: 'Users and sessions',
      items: [
        {
          name: 'Architecture',
          url: '/guides/auth/architecture',
          enabled: authArchitectureEnabled,
        },
        { name: 'Users', url: '/guides/auth/users' },
        {
          name: 'User management',
          url: '/guides/auth/managing-user-data',
          enabled: authConfigurationEnabled,
        },
        { name: 'Identities', url: '/guides/auth/identities' },
        {
          name: 'Identity linking',
          url: '/guides/auth/auth-identity-linking',
          enabled: authFlowsEnabled,
        },
        {
          name: 'Sessions',
          items: [
            { name: 'Overview', url: '/guides/auth/sessions' },
            { name: 'Implicit flow', url: '/guides/auth/sessions/implicit-flow' },
            { name: 'PKCE flow', url: '/guides/auth/sessions/pkce-flow' },
          ],
        },
        { name: 'Sign-out', url: '/guides/auth/signout', enabled: authFlowsEnabled },
      ],
    },
    {
      name: 'Sign-in options',
      enabled: allAuthProvidersEnabled && authFlowsEnabled,
      items: [
        {
          name: 'Social sign-in (OAuth)',
          items: [
            { name: 'Overview', url: '/guides/auth/social-sign-in' },
            ...[...SocialSignInItems].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
            { name: 'Custom OAuth/OIDC providers', url: '/guides/auth/custom-oauth-providers' },
          ],
        },
        { name: 'Password-based', url: '/guides/auth/passwords' },
        { name: 'Email (magic link or OTP)', url: '/guides/auth/auth-email-passwordless' },
        { name: 'Phone sign-in', url: '/guides/auth/phone-login' },
        { name: 'Passkey', url: '/guides/auth/passkeys' },
        {
          name: 'Enterprise SSO',
          items: [
            { name: 'About enterprise SSO', url: '/guides/auth/enterprise-sso' },
            {
              name: 'SAML 2.0 SSO',
              url: '/guides/auth/enterprise-sso/auth-sso-saml',
            },
          ],
        },
        { name: 'Anonymous sign-ins', url: '/guides/auth/auth-anonymous' },
        { name: 'Web3 (Ethereum or Solana)', url: '/guides/auth/auth-web3' },
      ],
    },
    {
      name: 'Settings and troubleshooting',
      items: [
        {
          name: 'General configuration',
          url: '/guides/auth/general-configuration',
          enabled: authConfigurationEnabled,
        },
        {
          name: 'Email templates',
          url: '/guides/auth/auth-email-templates',
          enabled: authConfigurationEnabled,
        },
        { name: 'Custom SMTP', url: '/guides/auth/auth-smtp', enabled: authConfigurationEnabled },
        { name: 'Test Auth flows', url: '/guides/auth/testing-auth-flows' },
        {
          name: 'Redirect URLs',
          url: '/guides/auth/redirect-urls',
          enabled: authConfigurationEnabled,
        },
        {
          name: 'Mobile deep linking',
          url: '/guides/auth/native-mobile-deep-linking',
          enabled: authFlowsEnabled,
        },
        {
          name: 'Auth Hooks',
          enabled: authConfigurationEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/auth-hooks' },
            {
              name: 'Custom access token hook',
              url: '/guides/auth/auth-hooks/custom-access-token-hook',
            },
            { name: 'Send SMS hook', url: '/guides/auth/auth-hooks/send-sms-hook' },
            { name: 'Send email hook', url: '/guides/auth/auth-hooks/send-email-hook' },
            {
              name: 'MFA verification hook',
              url: '/guides/auth/auth-hooks/mfa-verification-hook',
            },
            {
              name: 'Password verification hook',
              url: '/guides/auth/auth-hooks/password-verification-hook',
            },
            {
              name: 'Before User Created hook',
              url: '/guides/auth/auth-hooks/before-user-created-hook',
            },
          ],
        },
        {
          name: 'Debugging',
          items: [{ name: 'Error codes', url: '/guides/auth/debugging/error-codes' }],
        },
      ],
    },
    {
      name: 'Security and MFA',
      items: [
        {
          name: 'Multi-factor auth (MFA)',
          enabled: authFlowsEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/auth-mfa' },
            { name: 'App authenticator (TOTP)', url: '/guides/auth/auth-mfa/totp' },
            { name: 'Phone', url: '/guides/auth/auth-mfa/phone' },
          ],
        },
        {
          name: 'Password security',
          url: '/guides/auth/password-security',
          enabled: authFullSecurityEnabled,
        },
        { name: 'Rate limits', url: '/guides/auth/rate-limits', enabled: authFullSecurityEnabled },
        {
          name: 'Bot detection (CAPTCHA)',
          url: '/guides/auth/auth-captcha',
          enabled: authFullSecurityEnabled,
        },
        { name: 'Audit logs', url: '/guides/auth/audit-logs', enabled: authFullSecurityEnabled },
        {
          name: 'JSON Web Tokens (JWT)',
          enabled: authFullSecurityEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/jwts' },
            { name: 'Claims reference', url: '/guides/auth/jwt-fields' },
          ],
        },
        {
          name: 'JWT signing keys',
          url: '/guides/auth/signing-keys',
          enabled: authFullSecurityEnabled,
        },
      ],
    },
    {
      name: 'Third-party auth, migration',
      items: [
        {
          name: 'Third-party auth',
          enabled: allAuthProvidersEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/third-party/overview' },
            { name: 'Clerk', url: '/guides/auth/third-party/clerk' },
            { name: 'Firebase Auth', url: '/guides/auth/third-party/firebase-auth' },
            { name: 'Auth0', url: '/guides/auth/third-party/auth0' },
            { name: 'AWS Cognito (Amplify)', url: '/guides/auth/third-party/aws-cognito' },
            { name: 'WorkOS', url: '/guides/auth/third-party/workos' },
            { name: 'Custom OIDC', url: '/guides/auth/third-party/custom-oidc' },
          ],
        },
        {
          name: 'OAuth 2.1 Server',
          items: [
            { name: 'Overview', url: '/guides/auth/oauth-server' },
            { name: 'Getting started', url: '/guides/auth/oauth-server/getting-started' },
            { name: 'OAuth flows', url: '/guides/auth/oauth-server/oauth-flows' },
            { name: 'MCP authentication', url: '/guides/auth/oauth-server/mcp-authentication' },
            { name: 'Token security and RLS', url: '/guides/auth/oauth-server/token-security' },
          ],
        },
        {
          name: 'Migrate users',
          items: [
            {
              name: 'From Firebase Auth',
              url: 'https://supabase.com/kb/guides/migrate-from-firebase-auth',
            },
            { name: 'From Auth0', url: 'https://supabase.com/kb/guides/migrate-from-auth0' },
          ],
        },
      ],
    },
  ],
}
