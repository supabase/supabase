import type { ComponentProps } from 'react'
// End of third-party imports

import { isFeatureEnabled } from 'common/enabled-features'
import type { IconPanel } from 'ui-patterns/IconPanel'
import type { GlobalMenuItems, NavMenuConstant, NavMenuSection } from '../Navigation.types'

const {
  authenticationShowProviders: allAuthProvidersEnabled,
  billingAll: billingEnabled,
  docsAuthArchitecture: authArchitectureEnabled,
  docsAuthConfiguration: authConfigurationEnabled,
  docsAuthFlows: authFlowsEnabled,
  docsAuthFullSecurity: authFullSecurityEnabled,
  docsAuthTroubleshooting: authTroubleshootingEnabled,
  docsCompliance: complianceEnabled,
  docsContribution: contributionEnabled,
  docsFdw: fdwEnabled,
  docsFrameworkQuickstarts: frameworkQuickstartsEnabled,
  docsFullPlatform: fullPlatformEnabled,
  docsLocalDevelopment: localDevelopmentEnabled,
  docsMobileTutorials: mobileTutorialsEnabled,
  docsPgtap: pgTapEnabled,
  docsProductionChecklist: productionChecklistEnabled,
  'docsSelf-hosting': selfHostingEnabled,
  docsWebApps: webAppsEnabled,
  integrationsPartners: integrationsEnabled,
  sdkCsharp: sdkCsharpEnabled,
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkPython: sdkPythonEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled([
  'authentication:show_providers',
  'billing:all',
  'docs:auth_architecture',
  'docs:auth_configuration',
  'docs:auth_flows',
  'docs:auth_full_security',
  'docs:auth_troubleshooting',
  'docs:compliance',
  'docs:contribution',
  'docs:fdw',
  'docs:framework_quickstarts',
  'docs:full_platform',
  'docs:local_development',
  'docs:mobile_tutorials',
  'docs:pgtap',
  'docs:production_checklist',
  'docs:self-hosting',
  'docs:web_apps',
  'integrations:partners',
  'sdk:csharp',
  'sdk:dart',
  'sdk:kotlin',
  'sdk:python',
  'sdk:swift',
])

const jsOnly =
  !sdkCsharpEnabled && !sdkDartEnabled && !sdkKotlinEnabled && !sdkPythonEnabled && !sdkSwiftEnabled

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
      label: 'Products',
      menuItems: [
        [
          {
            label: 'Database',
            icon: 'database',
            href: '/guides/database/overview' as `/${string}`,
            level: 'database',
          },
          {
            label: 'Auth',
            icon: 'auth',
            href: '/guides/auth' as `/${string}`,
            level: 'auth',
          },
          {
            label: 'Storage',
            icon: 'storage',
            href: '/guides/storage' as `/${string}`,
            level: 'storage',
          },
          {
            label: 'Edge Functions',
            icon: 'edge-functions',
            href: '/guides/functions' as `/${string}`,
            level: 'functions',
          },
          {
            label: 'Realtime',
            icon: 'realtime',
            href: '/guides/realtime' as `/${string}`,
            level: 'realtime',
          },
        ],
        [
          { label: 'Postgres Modules' },
          {
            label: 'AI & Vectors',
            icon: 'ai',
            href: '/guides/ai' as `/${string}`,
            level: 'ai',
          },
          {
            label: 'Cron',
            icon: 'cron',
            href: '/guides/cron' as `/${string}`,
            level: 'cron',
          },
          {
            label: 'Queues',
            icon: 'queues',
            href: '/guides/queues' as `/${string}`,
            level: 'queues',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Build',
      menuItems: [
        [
          {
            label: 'Local Development & CLI',
            icon: 'dev-cli',
            href: '/guides/local-development' as `/${string}`,
            level: 'local_development',
          },
          {
            label: 'Deployment & Branching',
            icon: 'git-branch',
            href: '/guides/deployment' as `/${string}`,
            level: 'deployment',
          },
          {
            label: 'Self-Hosting',
            icon: 'self-hosting',
            href: '/guides/self-hosting' as `/${string}`,
            level: 'self_hosting',
            enabled: selfHostingEnabled,
          },
          {
            label: 'Integrations',
            icon: 'integrations',
            hasLightIcon: true,
            href: '/guides/integrations' as `/${string}`,
            level: 'integrations',
            enabled: integrationsEnabled,
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Manage',
      menuItems: [
        [
          {
            label: 'Platform Management',
            icon: 'platform',
            href: '/guides/platform' as `/${string}`,
            level: 'platform',
          },
          {
            label: 'Security & Compliance',
            icon: 'security',
            href: '/guides/security' as `/${string}`,
            level: 'security',
          },
          {
            label: 'Telemetry',
            icon: 'telemetry',
            href: '/guides/telemetry' as `/${string}`,
            level: 'telemetry',
          },
          {
            label: 'Troubleshooting',
            icon: 'troubleshooting',
            href: '/guides/troubleshooting' as `/${string}`,
            level: 'troubleshooting',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Reference',
      menuItems: [
        [
          {
            label: 'Client Library Reference',
          },
          {
            label: 'JavaScript',
            icon: 'reference-javascript',
            href: '/reference/javascript' as `/${string}`,
            level: 'reference_javascript',
          },
          {
            label: 'Flutter',
            icon: 'reference-dart',
            href: '/reference/dart' as `/${string}`,
            level: 'reference_dart',
            enabled: sdkDartEnabled,
          },
          {
            label: 'Swift',
            icon: 'reference-swift',
            href: '/reference/swift' as `/${string}`,
            level: 'reference_swift',
            enabled: sdkSwiftEnabled,
          },
          {
            label: 'Python',
            icon: 'reference-python',
            href: '/reference/python' as `/${string}`,
            level: 'reference_python',
            enabled: sdkPythonEnabled,
          },
          {
            label: 'C#',
            icon: 'reference-csharp',
            href: '/reference/csharp' as `/${string}`,
            level: 'reference_csharp',
            community: true,
            enabled: sdkCsharpEnabled,
          },
          {
            label: 'Kotlin',
            icon: 'reference-kotlin',
            href: '/reference/kotlin' as `/${string}`,
            level: 'reference_kotlin',
            community: true,
            enabled: sdkKotlinEnabled,
          },
        ],
        [
          {
            label: 'CLI Commands',
            icon: 'reference-cli',
            href: '/reference/cli/introduction' as `/${string}`,
            level: 'reference_javascript',
          },
          {
            label: 'Management API',
            icon: 'reference-api',
            href: '/reference/api/introduction' as `/${string}`,
            level: 'reference_javascript',
          },
          {
            label: 'UI Library',
            icon: 'ui',
            href: 'https://supabase.com/ui' as `/${string}`,
            level: 'ui',
          },
        ],
        [
          { label: 'Data API' },
          {
            label: 'REST',
            icon: 'rest',
            href: '/guides/api' as `/${string}`,
            level: 'api',
          },
          {
            label: 'GraphQL',
            icon: 'graphql',
            href: '/guides/graphql' as `/${string}`,
            level: 'graphql',
          },
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
            href: '/guides/resources/glossary' as `/${string}`,
            level: 'resources',
          },
          {
            label: 'Changelog',
            icon: 'changelog',
            hasLightIcon: true,
            href: 'https://supabase.com/changelog' as `/${string}`,
            level: 'changelog',
          },
          {
            label: 'Status',
            icon: 'status',
            href: 'https://status.supabase.com/',
          },
          {
            label: 'Contributing',
            icon: 'contributing',
            href: '/contributing' as `/${string}`,
            enabled: contributionEnabled,
          },
        ],
      ],
    },
  ],
]

export const gettingstarted: NavMenuConstant = {
  icon: 'getting-started',
  title: 'Start with Supabase',
  url: '/guides/getting-started',
  items: [
    { name: 'Features', url: '/guides/getting-started/features' },
    { name: 'Architecture', url: '/guides/getting-started/architecture' },
    {
      name: 'Framework Quickstarts',
      enabled: frameworkQuickstartsEnabled,
      items: [
        {
          name: 'Next.js',
          url: '/guides/getting-started/quickstarts/nextjs',
        },
        {
          name: 'React',
          url: '/guides/getting-started/quickstarts/reactjs',
        },
        {
          name: 'Nuxt',
          url: '/guides/getting-started/quickstarts/nuxtjs',
        },
        {
          name: 'Vue',
          url: '/guides/getting-started/quickstarts/vue',
        },
        {
          name: 'Hono',
          url: '/guides/getting-started/quickstarts/hono',
        },
        {
          name: 'Expo React Native',
          url: '/guides/getting-started/quickstarts/expo-react-native',
        },
        {
          name: 'Flutter',
          url: '/guides/getting-started/quickstarts/flutter',
        },
        {
          name: 'iOS SwiftUI',
          url: '/guides/getting-started/quickstarts/ios-swiftui',
        },
        {
          name: 'Android Kotlin',
          url: '/guides/getting-started/quickstarts/kotlin' as `/${string}`,
        },
        {
          name: 'SvelteKit',
          url: '/guides/getting-started/quickstarts/sveltekit' as `/${string}`,
        },
        {
          name: 'Flask (Python)',
          url: '/guides/getting-started/quickstarts/flask' as `/${string}`,
          enabled: !jsOnly,
        },
        {
          name: 'TanStack Start',
          url: '/guides/getting-started/quickstarts/tanstack' as `/${string}`,
        },
        {
          name: 'Laravel PHP',
          url: '/guides/getting-started/quickstarts/laravel' as `/${string}`,
          enabled: !jsOnly,
        },
        {
          name: 'Ruby on Rails',
          url: '/guides/getting-started/quickstarts/ruby-on-rails' as `/${string}`,
          enabled: !jsOnly,
        },
        {
          name: 'SolidJS',
          url: '/guides/getting-started/quickstarts/solidjs',
        },
        {
          name: 'RedwoodJS',
          url: '/guides/getting-started/quickstarts/redwoodjs' as `/${string}`,
        },
        {
          name: 'Refine',
          url: '/guides/getting-started/quickstarts/refine',
        },
      ],
    },
    {
      name: 'Web app demos',
      enabled: webAppsEnabled,
      items: [
        {
          name: 'Next.js',
          url: '/guides/getting-started/tutorials/with-nextjs' as `/${string}`,
        },
        {
          name: 'React',
          url: '/guides/getting-started/tutorials/with-react' as `/${string}`,
        },
        {
          name: 'Vue 3',
          url: '/guides/getting-started/tutorials/with-vue-3' as `/${string}`,
        },
        {
          name: 'Nuxt 3',
          url: '/guides/getting-started/tutorials/with-nuxt-3' as `/${string}`,
        },
        {
          name: 'Angular',
          url: '/guides/getting-started/tutorials/with-angular' as `/${string}`,
        },
        {
          name: 'RedwoodJS',
          url: '/guides/getting-started/tutorials/with-redwoodjs' as `/${string}`,
        },
        {
          name: 'SolidJS',
          url: '/guides/getting-started/tutorials/with-solidjs' as `/${string}`,
        },
        {
          name: 'Svelte',
          url: '/guides/getting-started/tutorials/with-svelte' as `/${string}`,
        },
        {
          name: 'SvelteKit',
          url: '/guides/getting-started/tutorials/with-sveltekit' as `/${string}`,
        },
        {
          name: 'Refine',
          url: '/guides/getting-started/tutorials/with-refine' as `/${string}`,
        },
      ],
    },
    {
      name: 'Mobile tutorials',
      enabled: mobileTutorialsEnabled,
      items: [
        {
          name: 'Flutter',
          url: '/guides/getting-started/tutorials/with-flutter' as `/${string}`,
          enabled: sdkDartEnabled,
        },

        {
          name: 'Expo React Native',
          url: '/guides/getting-started/tutorials/with-expo-react-native' as `/${string}`,
        },
        {
          name: 'Android Kotlin',
          url: '/guides/getting-started/tutorials/with-kotlin' as `/${string}`,
          enabled: sdkKotlinEnabled,
        },

        {
          name: 'Ionic React',
          url: '/guides/getting-started/tutorials/with-ionic-react' as `/${string}`,
        },
        {
          name: 'Ionic Vue',
          url: '/guides/getting-started/tutorials/with-ionic-vue' as `/${string}`,
        },
        {
          name: 'Ionic Angular',
          url: '/guides/getting-started/tutorials/with-ionic-angular' as `/${string}`,
        },
        {
          name: 'Swift',
          url: '/guides/getting-started/tutorials/with-swift' as `/${string}`,
          enabled: sdkSwiftEnabled,
        },
      ],
    },
    {
      name: 'AI Tools',
      url: undefined,
      items: [
        {
          name: 'Prompts',
          url: '/guides/getting-started/ai-prompts' as `/${string}`,
        },
        {
          name: 'Supabase MCP server',
          url: '/guides/getting-started/mcp' as `/${string}`,
        },
        {
          name: 'Deploy MCP servers',
          url: '/guides/getting-started/byo-mcp' as `/${string}`,
        },
      ],
    },
  ],
}

export const cli = {
  title: 'CLI',
  items: [
    { name: 'Overview', url: '/guides/cli' },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments' },
    {
      name: 'Using environment variables in config.toml',
      url: '/guides/cli/using-environment-variables-in-config',
    },
  ],
}

export const NativeMobileLoginItems = [
  {
    name: 'Apple',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/social-login/auth-apple?platform=react-native',
  },
  {
    name: 'Google',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/social-login/auth-google?platform=react-native',
  },
]

export const SocialLoginItems: Array<Partial<NavMenuSection>> = [
  {
    name: 'Google',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/social-login/auth-google',
  },
  {
    name: 'Facebook',
    icon: '/docs/img/icons/facebook-icon',
    url: '/guides/auth/social-login/auth-facebook',
  },
  {
    name: 'Apple',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/social-login/auth-apple',
  },
  {
    name: 'Azure (Microsoft)',
    icon: '/docs/img/icons/microsoft-icon',
    url: '/guides/auth/social-login/auth-azure',
  },
  {
    name: 'Twitter',
    icon: '/docs/img/icons/twitter-icon',
    url: '/guides/auth/social-login/auth-twitter',
    hasLightIcon: true,
  },
  {
    name: 'GitHub',
    icon: '/docs/img/icons/github-icon',
    url: '/guides/auth/social-login/auth-github',
    isDarkMode: true,
    hasLightIcon: true,
  },
  {
    name: 'Gitlab',
    icon: '/docs/img/icons/gitlab-icon',
    url: '/guides/auth/social-login/auth-gitlab',
  },
  {
    name: 'Bitbucket',
    icon: '/docs/img/icons/bitbucket-icon',
    url: '/guides/auth/social-login/auth-bitbucket',
  },
  {
    name: 'Discord',
    icon: '/docs/img/icons/discord-icon',
    url: '/guides/auth/social-login/auth-discord',
  },
  {
    name: 'Figma',
    icon: '/docs/img/icons/figma-icon',
    url: '/guides/auth/social-login/auth-figma',
  },
  {
    name: 'Kakao',
    icon: '/docs/img/icons/kakao-icon',
    url: '/guides/auth/social-login/auth-kakao',
  },
  {
    name: 'Keycloak',
    icon: '/docs/img/icons/keycloak-icon',
    url: '/guides/auth/social-login/auth-keycloak',
  },
  {
    name: 'LinkedIn',
    icon: '/docs/img/icons/linkedin-icon',
    url: '/guides/auth/social-login/auth-linkedin',
  },
  {
    name: 'Notion',
    icon: '/docs/img/icons/notion-icon',
    url: '/guides/auth/social-login/auth-notion',
  },
  {
    name: 'Slack',
    icon: '/docs/img/icons/slack-icon',
    url: '/guides/auth/social-login/auth-slack',
  },
  {
    name: 'Spotify',
    icon: '/docs/img/icons/spotify-icon',
    url: '/guides/auth/social-login/auth-spotify',
  },
  {
    name: 'Twitch',
    icon: '/docs/img/icons/twitch-icon',
    url: '/guides/auth/social-login/auth-twitch',
  },
  {
    name: 'WorkOS',
    icon: '/docs/img/icons/workos-icon',
    url: '/guides/auth/social-login/auth-workos',
  },
  {
    name: 'Zoom',
    icon: '/docs/img/icons/zoom-icon',
    url: '/guides/auth/social-login/auth-zoom',
  },
]

export const PhoneLoginsItems = [
  {
    name: 'MessageBird',
    icon: '/docs/img/icons/messagebird-icon',
    linkDescription: 'Communication between businesses and their customers — across any channel.',
    url: '/guides/auth/phone-login/messagebird',
  },
  {
    name: 'Twilio',
    icon: '/docs/img/icons/twilio-icon',
    url: '/guides/auth/phone-login/twilio',
    linkDescription: 'Customer engagement platform used by hundreds of thousands of businesses.',
  },
  {
    name: 'Vonage',
    icon: '/docs/img/icons/vonage-icon',
    url: '/guides/auth/phone-login/vonage',
    linkDescription:
      'Vonage is a communication platform as a service (CPaaS) provider for consumers and businesses.',
    isDarkMode: true,
    hasLightIcon: true,
  },
  {
    name: 'Textlocal (Community Supported)',
    icon: '/docs/img/icons/textlocal-icon',
    url: '/guides/auth/phone-login/textlocal',
    linkDescription: 'Textlocal is a cloud-based SMS platform offering bulk messaging services.',
  },
]

export const auth: NavMenuConstant = {
  icon: 'auth',
  title: 'Auth',
  items: [
    {
      name: 'Overview',
      url: '/guides/auth',
    },
    {
      name: 'Architecture',
      url: '/guides/auth/architecture',
      enabled: authArchitectureEnabled,
    },
    {
      name: 'Getting Started',
      enabled: frameworkQuickstartsEnabled,
      items: [
        {
          name: 'Next.js',
          url: '/guides/auth/quickstarts/nextjs' as `/${string}`,
        },
        { name: 'React', url: '/guides/auth/quickstarts/react', items: [] },
        {
          name: 'React Native',
          url: '/guides/auth/quickstarts/react-native' as `/${string}`,
        },
        {
          name: 'React Native with Expo & Social Auth',
          url: '/guides/auth/quickstarts/with-expo-react-native-social-auth',
        },
      ],
    },

    {
      name: 'Concepts',
      items: [
        { name: 'Users', url: '/guides/auth/users' },
        { name: 'Identities', url: '/guides/auth/identities' },
        {
          name: 'Sessions',
          url: '/guides/auth/sessions',
          items: [
            { name: 'User sessions', url: '/guides/auth/sessions' },
            { name: 'Implicit flow', url: '/guides/auth/sessions/implicit-flow' },
            { name: 'PKCE flow', url: '/guides/auth/sessions/pkce-flow' },
          ],
        },
      ],
    },
    {
      name: 'Flows (How-tos)',
      enabled: authFlowsEnabled,
      items: [
        {
          name: 'Server-Side Rendering',
          url: '/guides/auth/server-side',
          items: [
            { name: 'Overview', url: '/guides/auth/server-side' },
            { name: 'Creating a client', url: '/guides/auth/server-side/creating-a-client' },
            {
              name: 'Migrating from Auth Helpers',
              url: '/guides/auth/server-side/migrating-to-ssr-from-auth-helpers' as `/${string}`,
            },
            {
              name: 'Advanced guide',
              url: '/guides/auth/server-side/advanced-guide' as `/${string}`,
            },
          ],
        },
        {
          name: 'Password-based',
          url: '/guides/auth/passwords',
          enabled: allAuthProvidersEnabled,
        },
        {
          name: 'Email (Magic Link or OTP)',
          url: '/guides/auth/auth-email-passwordless',
          enabled: allAuthProvidersEnabled,
        },
        {
          name: 'Phone Login',
          url: '/guides/auth/phone-login' as `/${string}`,
          enabled: allAuthProvidersEnabled,
        },

        {
          name: 'Social Login (OAuth)',
          url: '/guides/auth/social-login',
          items: [{ name: 'Overview', url: '/guides/auth/social-login' }, ...SocialLoginItems],
          enabled: allAuthProvidersEnabled,
        },

        {
          name: 'Enterprise SSO',
          url: '/guides/auth/enterprise-sso',
          enabled: allAuthProvidersEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/enterprise-sso' },
            {
              name: 'SAML 2.0',
              url: '/guides/auth/enterprise-sso/auth-sso-saml' as `/${string}`,
            },
          ],
        },

        {
          name: 'Anonymous Sign-Ins',
          url: '/guides/auth/auth-anonymous',
          enabled: allAuthProvidersEnabled,
        },
        {
          name: 'Web3 (Ethereum or Solana)',
          url: '/guides/auth/auth-web3',
          enabled: allAuthProvidersEnabled,
        },
        { name: 'Mobile Deep Linking', url: '/guides/auth/native-mobile-deep-linking' },
        {
          name: 'Identity Linking',
          url: '/guides/auth/auth-identity-linking' as `/${string}`,
        },
        {
          name: 'Multi-Factor Authentication',
          url: '/guides/auth/auth-mfa',
          items: [
            { name: 'Overview', url: '/guides/auth/auth-mfa' },
            { name: 'App Authenticator (TOTP)', url: '/guides/auth/auth-mfa/totp' },
            { name: 'Phone', url: '/guides/auth/auth-mfa/phone' },
          ],
        },
        {
          name: 'Signout',
          url: '/guides/auth/signout' as `/${string}`,
        },
      ],
    },
    {
      name: 'Debugging',
      items: [
        { name: 'Error Codes', url: '/guides/auth/debugging/error-codes' },
        {
          name: 'Troubleshooting',
          url: '/guides/auth/troubleshooting',
          enabled: authTroubleshootingEnabled,
        },
      ],
    },
    {
      name: 'OAuth 2.1 Server',
      items: [
        { name: 'Overview', url: '/guides/auth/oauth-server' },
        { name: 'Getting Started', url: '/guides/auth/oauth-server/getting-started' },
        { name: 'OAuth Flows', url: '/guides/auth/oauth-server/oauth-flows' },
        { name: 'MCP Authentication', url: '/guides/auth/oauth-server/mcp-authentication' },
        { name: 'Token Security & RLS', url: '/guides/auth/oauth-server/token-security' },
      ],
    },
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
      ],
    },
    {
      name: 'Configuration',
      enabled: authConfigurationEnabled,
      items: [
        {
          name: 'General Configuration',
          url: '/guides/auth/general-configuration' as `/${string}`,
        },
        { name: 'Email Templates', url: '/guides/auth/auth-email-templates' },
        {
          name: 'Redirect URLs',
          url: '/guides/auth/redirect-urls' as `/${string}`,
        },
        {
          name: 'Auth Hooks',
          url: '/guides/auth/auth-hooks',
          items: [
            { name: 'Overview', url: '/guides/auth/auth-hooks' },
            {
              name: 'Custom access token hook',
              url: '/guides/auth/auth-hooks/custom-access-token-hook' as `/${string}`,
            },
            {
              name: 'Send SMS hook',
              url: '/guides/auth/auth-hooks/send-sms-hook' as `/${string}`,
            },
            {
              name: 'Send email hook',
              url: '/guides/auth/auth-hooks/send-email-hook' as `/${string}`,
            },
            {
              name: 'MFA verification hook',
              url: '/guides/auth/auth-hooks/mfa-verification-hook' as `/${string}`,
            },
            {
              name: 'Password verification hook',
              url: '/guides/auth/auth-hooks/password-verification-hook' as `/${string}`,
            },
            {
              name: 'Before User Created hook',
              url: '/guides/auth/auth-hooks/before-user-created-hook' as `/${string}`,
            },
          ],
        },
        { name: 'Custom SMTP', url: '/guides/auth/auth-smtp' },
        { name: 'User Management', url: '/guides/auth/managing-user-data' },
      ],
    },
    {
      name: 'Security',
      items: [
        {
          name: 'Password Security',
          url: '/guides/auth/password-security',
          enabled: authFullSecurityEnabled,
        },
        { name: 'Rate Limits', url: '/guides/auth/rate-limits', enabled: authFullSecurityEnabled },
        {
          name: 'Bot Detection (CAPTCHA)',
          url: '/guides/auth/auth-captcha',
          enabled: authFullSecurityEnabled,
        },
        { name: 'Audit Logs', url: '/guides/auth/audit-logs', enabled: authFullSecurityEnabled },
        {
          name: 'JSON Web Tokens (JWT)',
          url: '/guides/auth/jwts',
          enabled: authFullSecurityEnabled,
          items: [
            { name: 'Overview', url: '/guides/auth/jwts' },
            { name: 'Claims Reference', url: '/guides/auth/jwt-fields' },
          ],
        },
        {
          name: 'JWT Signing Keys',
          url: '/guides/auth/signing-keys',
          enabled: authFullSecurityEnabled,
        },
        { name: 'Row Level Security', url: '/guides/database/postgres/row-level-security' },
        {
          name: 'Column Level Security',
          url: '/guides/database/postgres/column-level-security' as `/${string}`,
        },
        {
          name: 'Custom Claims & RBAC',
          url: '/guides/database/postgres/custom-claims-and-role-based-access-control-rbac' as `/${string}`,
        },
      ],
    },
  ],
}

const ormQuickstarts: NavMenuSection = {
  name: 'ORM Quickstarts',
  url: undefined,
  items: [
    {
      name: 'Prisma',
      url: '/guides/database/prisma',
      items: [
        { name: 'Connecting with Prisma', url: '/guides/database/prisma' as `/${string}` },
        {
          name: 'Prisma troubleshooting',
          url: '/guides/database/prisma/prisma-troubleshooting' as `/${string}`,
        },
      ],
    },
    {
      name: 'Drizzle',
      url: '/guides/database/drizzle',
    },
    {
      name: 'Postgres.js',
      url: '/guides/database/postgres-js',
    },
  ],
}

const guiQuickstarts: NavMenuSection = {
  name: 'GUI quickstarts',
  url: undefined,
  items: [
    {
      name: 'pgAdmin',
      url: '/guides/database/pgadmin',
    },
    {
      name: 'PSQL',
      url: '/guides/database/psql',
    },
    {
      name: 'DBeaver',
      url: '/guides/database/dbeaver',
    },
    {
      name: 'Metabase',
      url: '/guides/database/metabase',
    },
    {
      name: 'Beekeeper Studio',
      url: '/guides/database/beekeeper-studio',
    },
  ],
}

export const database: NavMenuConstant = {
  icon: 'database',
  title: 'Database',
  url: '/guides/database/overview',
  items: [
    { name: 'Overview', url: '/guides/database/overview' },
    {
      name: 'Fundamentals',
      url: undefined,
      items: [
        {
          name: 'Connecting to your database',
          url: '/guides/database/connecting-to-postgres' as `/${string}`,
        },
        { name: 'Importing data', url: '/guides/database/import-data' },
        { name: 'Securing your data', url: '/guides/database/secure-data' },
      ],
    },
    {
      name: 'Working with your database (basics)',
      url: undefined,
      items: [
        {
          name: 'Managing tables, views, and data',
          url: '/guides/database/tables' as `/${string}`,
        },
        {
          name: 'Working with arrays',
          url: '/guides/database/arrays' as `/${string}`,
        },
        { name: 'Managing indexes', url: '/guides/database/postgres/indexes' },
        {
          name: 'Querying joins and nested tables',
          url: '/guides/database/joins-and-nesting' as `/${string}`,
        },
        { name: 'JSON and unstructured data', url: '/guides/database/json' },
      ],
    },
    {
      name: 'Working with your database (intermediate)',
      url: undefined,
      items: [
        {
          name: 'Implementing cascade deletes',
          url: '/guides/database/postgres/cascade-deletes' as `/${string}`,
        },
        { name: 'Managing enums', url: '/guides/database/postgres/enums' },
        {
          name: 'Managing database functions',
          url: '/guides/database/functions' as `/${string}`,
        },
        {
          name: 'Managing database triggers',
          url: '/guides/database/postgres/triggers' as `/${string}`,
        },
        {
          name: 'Managing database webhooks',
          url: '/guides/database/webhooks' as `/${string}`,
        },
        {
          name: 'Using Full Text Search',
          url: '/guides/database/full-text-search' as `/${string}`,
        },
        {
          name: 'Partitioning your tables',
          url: '/guides/database/partitions' as `/${string}`,
        },
        {
          name: 'Managing connections',
          url: '/guides/database/connection-management' as `/${string}`,
        },
        {
          name: 'Managing event triggers',
          url: '/guides/database/postgres/event-triggers' as `/${string}`,
        },
      ],
    },
    {
      name: 'OrioleDB',
      url: undefined,
      items: [
        {
          name: 'Overview',
          url: '/guides/database/orioledb' as `/${string}`,
        },
      ],
    },
    {
      name: 'Access and security',
      url: undefined,
      items: [
        {
          name: 'Row Level Security',
          url: '/guides/database/postgres/row-level-security' as `/${string}`,
        },
        {
          name: 'Column Level Security',
          url: '/guides/database/postgres/column-level-security' as `/${string}`,
        },
        {
          name: 'Hardening the Data API',
          url: '/guides/database/hardening-data-api' as `/${string}`,
        },
        {
          name: 'Custom Claims & RBAC',
          url: '/guides/database/postgres/custom-claims-and-role-based-access-control-rbac' as `/${string}`,
        },
        {
          name: 'Managing Postgres Roles',
          url: '/guides/database/postgres/roles' as `/${string}`,
        },
        {
          name: 'Using Custom Postgres Roles',
          url: '/guides/storage/schema/custom-roles' as `/${string}`,
        },
        { name: 'Managing secrets with Vault', url: '/guides/database/vault' },
        {
          name: 'Superuser Access and Unsupported Operations',
          url: '/guides/database/postgres/roles-superuser' as `/${string}`,
        },
      ],
    },
    {
      name: 'Configuration, optimization, and testing',
      url: undefined,
      items: [
        {
          name: 'Database configuration',
          url: '/guides/database/postgres/configuration' as `/${string}`,
        },
        {
          name: 'Query optimization',
          url: '/guides/database/query-optimization' as `/${string}`,
        },
        {
          name: 'Database Advisors',
          url: '/guides/database/database-advisors' as `/${string}`,
        },
        { name: 'Testing your database', url: '/guides/database/testing' },
        {
          name: 'Customizing Postgres config',
          url: '/guides/database/custom-postgres-config' as `/${string}`,
        },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        {
          name: 'Timeouts',
          url: '/guides/database/postgres/timeouts' as `/${string}`,
        },
        {
          name: 'Debugging and monitoring',
          url: '/guides/database/inspect' as `/${string}`,
        },
        {
          name: 'Debugging performance issues',
          url: '/guides/database/debugging-performance' as `/${string}`,
        },
        {
          name: 'Supavisor',
          url: '/guides/database/supavisor' as `/${string}`,
        },
        {
          name: 'Troubleshooting',
          url: '/guides/database/troubleshooting' as `/${string}`,
        },
      ],
    },
    ormQuickstarts,
    guiQuickstarts,
    {
      name: 'Database replication',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/database/replication' },
        {
          name: 'Replication',
          url: '/guides/database/replication/replication-setup' as `/${string}`,
          items: [
            {
              name: 'Setting up',
              url: '/guides/database/replication/replication-setup' as `/${string}`,
            },
            {
              name: 'Monitoring',
              url: '/guides/database/replication/replication-monitoring' as `/${string}`,
            },
            { name: 'FAQ', url: '/guides/database/replication/replication-faq' },
          ],
        },
        {
          name: 'Manual replication',
          url: '/guides/database/replication/manual-replication-setup' as `/${string}`,
          items: [
            {
              name: 'Setting up',
              url: '/guides/database/replication/manual-replication-setup' as `/${string}`,
            },
            {
              name: 'Monitoring',
              url: '/guides/database/replication/manual-replication-monitoring' as `/${string}`,
            },
            { name: 'FAQ', url: '/guides/database/replication/manual-replication-faq' },
          ],
        },
      ],
    },
    {
      name: 'Extensions',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/database/extensions' },
        {
          name: 'HypoPG: Hypothetical indexes',
          url: '/guides/database/extensions/hypopg' as `/${string}`,
        },
        {
          name: 'plv8 (deprecated)',
          url: '/guides/database/extensions/plv8' as `/${string}`,
        },
        {
          name: 'http: RESTful Client',
          url: '/guides/database/extensions/http' as `/${string}`,
        },
        {
          name: 'index_advisor: Query optimization',
          url: '/guides/database/extensions/index_advisor' as `/${string}`,
        },
        {
          name: 'PGAudit: Postgres Auditing',
          url: '/guides/database/extensions/pgaudit' as `/${string}`,
        },
        {
          name: 'pgjwt (deprecated)',
          url: '/guides/database/extensions/pgjwt' as `/${string}`,
        },
        {
          name: 'PGroonga: Multilingual Full Text Search',
          url: '/guides/database/extensions/pgroonga' as `/${string}`,
        },
        {
          name: 'pgRouting: Geospatial Routing',
          url: '/guides/database/extensions/pgrouting' as `/${string}`,
        },
        {
          name: 'pg_cron: Schedule Recurring Jobs',
          url: '/guides/database/extensions/pg_cron' as `/${string}`,
        },
        {
          name: 'pg_graphql: GraphQL Support',
          url: '/guides/database/extensions/pg_graphql' as `/${string}`,
        },
        {
          name: 'pg_hashids: Short UIDs',
          url: '/guides/database/extensions/pg_hashids' as `/${string}`,
        },
        {
          name: 'pg_jsonschema: JSON Schema Validation',
          url: '/guides/database/extensions/pg_jsonschema' as `/${string}`,
        },
        {
          name: 'pg_net: Async Networking',
          url: '/guides/database/extensions/pg_net' as `/${string}`,
        },
        {
          name: 'pg_plan_filter: Restrict Total Cost',
          url: '/guides/database/extensions/pg_plan_filter' as `/${string}`,
        },
        {
          name: 'postgres_fdw: query data from an external Postgres server',
          url: '/guides/database/extensions/postgres_fdw' as `/${string}`,
        },
        {
          name: 'pgvector: Embeddings and vector similarity',
          url: '/guides/database/extensions/pgvector' as `/${string}`,
        },
        {
          name: 'pg_stat_statements: SQL Planning and Execution Statistics',
          url: '/guides/database/extensions/pg_stat_statements' as `/${string}`,
        },
        {
          name: 'pg_repack: Storage Optimization',
          url: '/guides/database/extensions/pg_repack' as `/${string}`,
        },
        {
          name: 'PostGIS: Geo queries',
          url: '/guides/database/extensions/postgis' as `/${string}`,
        },
        {
          name: 'pgmq: Queues',
          url: '/guides/database/extensions/pgmq' as `/${string}`,
        },
        {
          name: 'pgsodium (pending deprecation): Encryption Features',
          url: '/guides/database/extensions/pgsodium' as `/${string}`,
        },
        {
          name: 'pgTAP: Unit Testing',
          url: '/guides/database/extensions/pgtap' as `/${string}`,
        },
        {
          name: 'plpgsql_check: PL/pgSQL Linter',
          url: '/guides/database/extensions/plpgsql_check' as `/${string}`,
        },
        {
          name: 'timescaledb (deprecated)',
          url: '/guides/database/extensions/timescaledb' as `/${string}`,
        },
        {
          name: 'uuid-ossp: Unique Identifiers',
          url: '/guides/database/extensions/uuid-ossp' as `/${string}`,
        },
        {
          name: 'RUM: inverted index for full-text search',
          url: '/guides/database/extensions/rum' as `/${string}`,
        },
      ],
    },
    {
      name: 'Foreign Data Wrappers',
      url: undefined,
      enabled: fdwEnabled,
      items: [
        {
          name: 'Overview',
          url: '/guides/database/extensions/wrappers/overview' as `/${string}`,
        },
        {
          name: 'Connecting to Auth0',
          url: '/guides/database/extensions/wrappers/auth0' as `/${string}`,
        },
        {
          name: 'Connecting to Airtable',
          url: '/guides/database/extensions/wrappers/airtable' as `/${string}`,
        },
        {
          name: 'Connecting to AWS Cognito',
          url: '/guides/database/extensions/wrappers/cognito' as `/${string}`,
        },
        {
          name: 'Connecting to AWS S3',
          url: '/guides/database/extensions/wrappers/s3' as `/${string}`,
        },
        {
          name: 'Connecting to AWS S3 Vectors',
          url: '/guides/database/extensions/wrappers/s3_vectors' as `/${string}`,
        },
        {
          name: 'Connecting to BigQuery',
          url: '/guides/database/extensions/wrappers/bigquery' as `/${string}`,
        },
        {
          name: 'Connecting to Clerk',
          url: '/guides/database/extensions/wrappers/clerk' as `/${string}`,
        },
        {
          name: 'Connecting to ClickHouse',
          url: '/guides/database/extensions/wrappers/clickhouse' as `/${string}`,
        },
        {
          name: 'Connecting to DuckDB',
          url: '/guides/database/extensions/wrappers/duckdb' as `/${string}`,
        },
        {
          name: 'Connecting to Firebase',
          url: '/guides/database/extensions/wrappers/firebase' as `/${string}`,
        },
        {
          name: 'Connecting to Iceberg',
          url: '/guides/database/extensions/wrappers/iceberg' as `/${string}`,
        },
        {
          name: 'Connecting to Logflare',
          url: '/guides/database/extensions/wrappers/logflare' as `/${string}`,
        },
        {
          name: 'Connecting to MSSQL',
          url: '/guides/database/extensions/wrappers/mssql' as `/${string}`,
        },
        {
          name: 'Connecting to Notion',
          url: '/guides/database/extensions/wrappers/notion' as `/${string}`,
        },
        {
          name: 'Connecting to Paddle',
          url: '/guides/database/extensions/wrappers/paddle' as `/${string}`,
        },
        {
          name: 'Connecting to Redis',
          url: '/guides/database/extensions/wrappers/redis' as `/${string}`,
        },
        {
          name: 'Connecting to Snowflake',
          url: '/guides/database/extensions/wrappers/snowflake' as `/${string}`,
        },
        {
          name: 'Connecting to Stripe',
          url: '/guides/database/extensions/wrappers/stripe' as `/${string}`,
        },
      ],
    },
    {
      name: 'Examples',
      url: undefined,
      items: [
        {
          name: 'Drop All Tables in Schema',
          url: '/guides/database/postgres/dropping-all-tables-in-schema' as `/${string}`,
        },
        {
          name: 'Select First Row per Group',
          url: '/guides/database/postgres/first-row-in-group' as `/${string}`,
        },
        {
          name: 'Print PostgreSQL Version',
          url: '/guides/database/postgres/which-version-of-postgres' as `/${string}`,
        },
        {
          name: 'Replicating from Supabase to External Postgres',
          url: '/guides/database/postgres/setup-replication-external' as `/${string}`,
        },
      ],
    },
  ],
}

export const cron: NavMenuConstant = {
  icon: 'cron',
  title: 'Cron',
  url: '/guides/cron',
  items: [
    { name: 'Overview', url: '/guides/cron' },
    {
      name: 'Getting Started',
      url: undefined,
      items: [
        { name: 'Install', url: '/guides/cron/install' },
        { name: 'Quickstart', url: '/guides/cron/quickstart' },
      ],
    },
  ],
}

export const queues: NavMenuConstant = {
  icon: 'queues',
  title: 'Queues',
  url: '/guides/queues',
  items: [
    { name: 'Overview', url: '/guides/queues' },
    {
      name: 'Getting Started',
      url: undefined,
      items: [
        { name: 'Quickstart', url: '/guides/queues/quickstart' },
        {
          name: 'Consuming Messages with Edge Functions',
          url: '/guides/queues/consuming-messages-with-edge-functions',
        },
        {
          name: 'Expose Queues for local and self-hosted Supabase',
          url: '/guides/queues/expose-self-hosted-queues',
        },
      ],
    },
    {
      name: 'References',
      url: undefined,
      items: [
        { name: 'API', url: '/guides/queues/api' },
        { name: 'PGMQ Extension', url: '/guides/queues/pgmq' },
      ],
    },
  ],
}

export const api: NavMenuConstant = {
  icon: 'rest',
  title: 'REST API',
  url: '/guides/api',
  items: [
    { name: 'Overview', url: '/guides/api', items: [] },
    { name: 'Quickstart', url: '/guides/api/quickstart', items: [] },
    {
      name: 'Client Libraries',
      url: '/guides/api/rest/client-libs',
      items: [],
    },
    {
      name: 'Auto-generated Docs',
      url: '/guides/api/rest/auto-generated-docs',
      items: [],
    },
    {
      name: 'Generating TypeScript Types',
      url: '/guides/api/rest/generating-types',
      items: [],
    },
    {
      name: 'Generating Python Types',
      url: '/guides/api/rest/generating-python-types',
      items: [],
    },
    {
      name: 'Tools',
      url: '/guides/api',
      items: [{ name: 'SQL to REST API Translator', url: '/guides/api/sql-to-rest' }],
    },
    {
      name: 'Guides',
      url: '/guides/api',
      items: [
        { name: 'Creating API routes', url: '/guides/api/creating-routes' },
        { name: 'How API Keys work', url: '/guides/api/api-keys' },
        { name: 'Securing your API', url: '/guides/api/securing-your-api' },
        { name: 'Error Codes', url: '/guides/api/rest/postgrest-error-codes' },
      ],
    },
    {
      name: 'Using the Data APIs',
      url: '/guides/api/data-apis',
      items: [
        {
          name: 'Managing tables, views, and data',
          url: '/guides/database/tables' as `/${string}`,
        },
        {
          name: 'Querying joins and nested tables',
          url: '/guides/database/joins-and-nesting' as `/${string}`,
        },
        {
          name: 'JSON and unstructured data',
          url: '/guides/database/json' as `/${string}`,
        },
        {
          name: 'Managing database functions',
          url: '/guides/database/functions' as `/${string}`,
        },
        {
          name: 'Using full-text search',
          url: '/guides/database/full-text-search' as `/${string}`,
        },
        {
          name: 'Debugging performance issues',
          url: '/guides/database/debugging-performance' as `/${string}`,
        },
        {
          name: 'Using custom schemas',
          url: '/guides/api/using-custom-schemas' as `/${string}`,
        },
        {
          name: 'Converting from SQL to JavaScript API',
          url: '/guides/api/sql-to-api' as `/${string}`,
        },
      ],
    },
  ],
}

export const graphql: NavMenuConstant = {
  icon: 'graphql',
  title: 'GraphQL',
  url: '/guides/graphql',
  items: [
    { name: 'Overview', url: '/guides/graphql', items: [] },
    { name: 'API', url: '/guides/graphql/api', items: [] },
    { name: 'Views', url: '/guides/graphql/views', items: [] },
    { name: 'Functions', url: '/guides/graphql/functions', items: [] },
    {
      name: 'Configuration & Customization',
      url: '/guides/graphql/configuration',
      items: [],
    },
    { name: 'Security', url: '/guides/graphql/security', items: [] },
    {
      name: 'Integrations',
      items: [
        { name: 'With Apollo', url: '/guides/graphql/with-apollo' },
        { name: 'With Relay', url: '/guides/graphql/with-relay' },
      ],
    },
  ],
}

export const functions: NavMenuConstant = {
  icon: 'edge-functions',
  title: 'Edge Functions',
  url: '/guides/functions',
  items: [
    {
      name: 'Overview',
      url: '/guides/functions',
    },
    {
      name: 'Getting started',
      url: undefined,
      items: [
        {
          name: 'Quickstart (Dashboard)',
          url: '/guides/functions/quickstart-dashboard' as `/${string}`,
        },
        {
          name: 'Quickstart (CLI)',
          url: '/guides/functions/quickstart' as `/${string}`,
        },
        {
          name: 'Development Environment',
          url: '/guides/functions/development-environment' as `/${string}`,
        },
        {
          name: 'Architecture',
          url: '/guides/functions/architecture',
        },
      ],
    },
    {
      name: 'Configuration',
      url: undefined,
      items: [
        { name: 'Environment Variables', url: '/guides/functions/secrets' },
        { name: 'Managing Dependencies', url: '/guides/functions/dependencies' },
        { name: 'Function Configuration', url: '/guides/functions/function-configuration' },
      ],
    },
    {
      name: 'Development',
      url: undefined,
      items: [
        { name: 'Error Handling', url: '/guides/functions/error-handling' },
        { name: 'Routing', url: '/guides/functions/routing' },
        {
          name: 'Deploy to Production',
          url: '/guides/functions/deploy' as `/${string}`,
        },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        {
          name: 'Local Debugging with DevTools',
          url: '/guides/functions/debugging-tools' as `/${string}`,
        },
        {
          name: 'Testing your Functions',
          url: '/guides/functions/unit-test' as `/${string}`,
        },
        {
          name: 'Logging',
          url: '/guides/functions/logging' as `/${string}`,
        },
        {
          name: 'Troubleshooting',
          url: '/guides/functions/troubleshooting' as `/${string}`,
        },
      ],
    },
    {
      name: 'Platform',
      url: undefined,
      items: [
        {
          name: 'Regional invocations',
          url: '/guides/functions/regional-invocation' as `/${string}`,
        },
        {
          name: 'Status codes',
          url: '/guides/functions/status-codes' as `/${string}`,
        },
        {
          name: 'Limits',
          url: '/guides/functions/limits' as `/${string}`,
          enabled: billingEnabled,
        },
        {
          name: 'Pricing',
          url: '/guides/functions/pricing' as `/${string}`,
          enabled: billingEnabled,
        },
      ],
    },
    {
      name: 'Integrations',
      url: undefined,
      items: [
        {
          name: 'Supabase Auth',
          url: '/guides/functions/auth',
          items: [
            { name: 'Securing your functions', url: '/guides/functions/auth' },
            { name: 'Legacy JWT secret', url: '/guides/functions/auth-legacy-jwt' },
          ],
        },
        { name: 'Supabase Database (Postgres)', url: '/guides/functions/connect-to-postgres' },
        { name: 'Supabase Storage', url: '/guides/functions/storage-caching' },
      ],
    },
    {
      name: 'Advanced Features',
      url: undefined,
      items: [
        { name: 'Background Tasks', url: '/guides/functions/background-tasks' },
        { name: 'File Storage', url: '/guides/functions/ephemeral-storage' },
        { name: 'WebSockets', url: '/guides/functions/websockets' },
        { name: 'Custom Routing', url: '/guides/functions/routing' },
        { name: 'Wasm Modules', url: '/guides/functions/wasm' },
        { name: 'AI Models', url: '/guides/functions/ai-models' },
      ],
    },
    {
      name: 'Examples',
      url: undefined,
      items: [
        {
          name: 'Auth Send Email Hook',
          url: '/guides/functions/examples/auth-send-email-hook-react-email-resend' as `/${string}`,
        },
        {
          name: 'Building an MCP Server with mcp-lite',
          url: '/guides/functions/examples/mcp-server-mcp-lite' as `/${string}`,
        },
        {
          name: 'CORS support for invoking from the browser',
          url: '/guides/functions/cors' as `/${string}`,
        },
        {
          name: 'Scheduling Functions',
          url: '/guides/functions/schedule-functions' as `/${string}`,
        },
        {
          name: 'Sending Push Notifications',
          url: '/guides/functions/examples/push-notifications' as `/${string}`,
        },
        {
          name: 'Generating AI images',
          url: '/guides/functions/examples/amazon-bedrock-image-generator' as `/${string}`,
        },
        {
          name: 'Generating OG images ',
          url: '/guides/functions/examples/og-image' as `/${string}`,
        },
        {
          name: 'Semantic AI Search',
          url: '/guides/functions/examples/semantic-search' as `/${string}`,
        },
        {
          name: 'CAPTCHA support with Cloudflare Turnstile',
          url: '/guides/functions/examples/cloudflare-turnstile' as `/${string}`,
        },
        {
          name: 'Building a Discord Bot',
          url: '/guides/functions/examples/discord-bot' as `/${string}`,
        },
        {
          name: 'Building a Telegram Bot',
          url: '/guides/functions/examples/telegram-bot' as `/${string}`,
        },
        {
          name: 'Handling Stripe Webhooks ',
          url: '/guides/functions/examples/stripe-webhooks' as `/${string}`,
        },
        {
          name: 'Rate-limiting with Redis',
          url: '/guides/functions/examples/rate-limiting' as `/${string}`,
        },
        {
          name: 'Taking Screenshots with Puppeteer',
          url: '/guides/functions/examples/screenshots' as `/${string}`,
        },
        {
          name: 'Slack Bot responding to mentions',
          url: '/guides/functions/examples/slack-bot-mention' as `/${string}`,
        },
        {
          name: 'Image Transformation & Optimization',
          url: '/guides/functions/examples/image-manipulation' as `/${string}`,
        },
      ],
    },
    {
      name: 'Third-Party Tools',
      url: undefined,
      items: [
        { name: 'Dart Edge on Supabase', url: '/guides/functions/dart-edge' },
        {
          name: 'mcp-lite (Model Context Protocol)',
          url: '/guides/functions/examples/mcp-server-mcp-lite' as `/${string}`,
        },
        {
          name: 'Browserless.io',
          url: '/guides/functions/examples/screenshots' as `/${string}`,
        },
        {
          name: 'Hugging Face',
          url: '/guides/ai/examples/huggingface-image-captioning' as `/${string}`,
        },
        {
          name: 'Monitoring with Sentry',
          url: '/guides/functions/examples/sentry-monitoring' as `/${string}`,
        },
        { name: 'OpenAI API', url: '/guides/ai/examples/openai' },
        {
          name: 'React Email',
          url: '/guides/functions/examples/auth-send-email-hook-react-email-resend' as `/${string}`,
        },
        {
          name: 'Sending Emails with Resend',
          url: '/guides/functions/examples/send-emails' as `/${string}`,
        },
        {
          name: 'Upstash Redis',
          url: '/guides/functions/examples/upstash-redis' as `/${string}`,
        },
        {
          name: 'Type-Safe SQL with Kysely',
          url: '/guides/functions/kysely-postgres' as `/${string}`,
        },
        {
          name: 'Text To Speech with ElevenLabs',
          url: '/guides/functions/examples/elevenlabs-generate-speech-stream' as `/${string}`,
        },
        {
          name: 'Speech Transcription with ElevenLabs',
          url: '/guides/functions/examples/elevenlabs-transcribe-speech' as `/${string}`,
        },
      ],
    },
  ],
}

export const realtime: NavMenuConstant = {
  icon: 'realtime',
  title: 'Realtime',
  url: '/guides/realtime',
  items: [
    {
      name: 'Overview',
      url: '/guides/realtime',
    },
    {
      name: 'Getting Started',
      url: '/guides/realtime/getting_started',
    },
    {
      name: 'Usage',
      url: undefined,
      items: [
        { name: 'Broadcast', url: '/guides/realtime/broadcast' },
        { name: 'Presence', url: '/guides/realtime/presence' },
        {
          name: 'Postgres Changes',
          url: '/guides/realtime/postgres-changes' as `/${string}`,
        },
        { name: 'Settings', url: '/guides/realtime/settings' },
      ],
    },
    {
      name: 'Security',
      url: undefined,
      items: [{ name: 'Authorization', url: '/guides/realtime/authorization' }],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        {
          name: 'Realtime Reports',
          url: '/guides/realtime/reports' as `/${string}`,
        },
        {
          name: 'Subscribing to Database Changes',
          url: '/guides/realtime/subscribing-to-database-changes' as `/${string}`,
        },
        {
          name: 'Using Realtime with Next.js',
          url: '/guides/realtime/realtime-with-nextjs' as `/${string}`,
        },
        {
          name: 'Using Realtime Presence with Flutter',
          url: '/guides/realtime/realtime-user-presence' as `/${string}`,
        },
        {
          name: 'Listening to Postgres Changes with Flutter',
          url: '/guides/realtime/realtime-listening-flutter' as `/${string}`,
        },
      ],
    },
    {
      name: 'Deep dive',
      url: undefined,
      items: [
        { name: 'Limits', url: '/guides/realtime/limits', enabled: billingEnabled },
        {
          name: 'Pricing',
          url: '/guides/realtime/pricing' as `/${string}`,
          enabled: billingEnabled,
        },
        { name: 'Architecture', url: '/guides/realtime/architecture' },
        { name: 'Concepts', url: '/guides/realtime/concepts' },
        { name: 'Protocol', url: '/guides/realtime/protocol', items: [] },
        { name: 'Benchmarks', url: '/guides/realtime/benchmarks' },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        { name: 'Operational Error Codes', url: '/guides/realtime/error_codes', items: [] },
        { name: 'Troubleshooting', url: '/guides/realtime/troubleshooting' },
      ],
    },
  ],
}

export const storage: NavMenuConstant = {
  icon: 'storage',
  title: 'Storage',
  url: '/guides/storage',
  items: [
    { name: 'Overview', url: '/guides/storage' },
    {
      name: 'File Buckets',
      url: undefined,
      items: [
        { name: 'Quickstart', url: '/guides/storage/quickstart' },
        { name: 'Fundamentals', url: '/guides/storage/buckets/fundamentals' },
        {
          name: 'Creating Buckets',
          url: '/guides/storage/buckets/creating-buckets' as `/${string}`,
        },
        {
          name: 'Security',
          url: '/guides/storage/security',
          items: [
            {
              name: 'Ownership',
              url: '/guides/storage/security/ownership' as `/${string}`,
            },
            {
              name: 'Access Control',
              url: '/guides/storage/security/access-control' as `/${string}`,
            },
          ],
        },
        {
          name: 'Uploads',
          url: '/guides/storage/uploads',
          items: [
            {
              name: 'Standard Uploads',
              url: '/guides/storage/uploads/standard-uploads' as `/${string}`,
            },
            {
              name: 'Resumable Uploads',
              url: '/guides/storage/uploads/resumable-uploads' as `/${string}`,
            },
            {
              name: 'S3 Uploads',
              url: '/guides/storage/uploads/s3-uploads' as `/${string}`,
            },
            { name: 'Limits', url: '/guides/storage/uploads/file-limits', enabled: billingEnabled },
          ],
        },
        {
          name: 'Serving',
          url: '/guides/storage/serving',
          items: [
            { name: 'Serving assets', url: '/guides/storage/serving/downloads' },
            {
              name: 'Image Transformations',
              url: '/guides/storage/serving/image-transformations' as `/${string}`,
            },
            {
              name: 'Bandwidth & Storage Egress',
              url: '/guides/storage/serving/bandwidth' as `/${string}`,
              enabled: billingEnabled,
            },
          ],
        },
        {
          name: 'Management',
          url: '/guides/storage/management',
          items: [
            { name: 'Copy / Move Objects', url: '/guides/storage/management/copy-move-objects' },
            { name: 'Delete Objects', url: '/guides/storage/management/delete-objects' },
          ],
        },
        {
          name: 'S3',
          url: '/guides/storage/s3',
          items: [
            { name: 'Authentication', url: '/guides/storage/s3/authentication' },
            { name: 'API Compatibility', url: '/guides/storage/s3/compatibility' },
          ],
        },
        {
          name: 'CDN',
          url: '/guides/storage/cdn',
          items: [
            { name: 'Fundamentals', url: '/guides/storage/cdn/fundamentals' },
            { name: 'Smart CDN', url: '/guides/storage/cdn/smart-cdn' },
            { name: 'Metrics', url: '/guides/storage/cdn/metrics' },
          ],
        },
        {
          name: 'Debugging',
          url: '/guides/storage/debugging',
          items: [
            { name: 'Logs', url: '/guides/storage/debugging/logs' },
            { name: 'Error Codes', url: '/guides/storage/debugging/error-codes' },
            { name: 'Troubleshooting', url: '/guides/storage/troubleshooting' },
          ],
        },
        {
          name: 'Schema',
          url: '/guides/storage/schema',
          items: [
            { name: 'Database Design', url: '/guides/storage/schema/design' },
            {
              name: 'Helper Functions',
              url: '/guides/storage/schema/helper-functions' as `/${string}`,
            },
            { name: 'Custom Roles', url: '/guides/storage/schema/custom-roles' },
          ],
        },
        {
          name: 'Going to production',
          url: '/guides/storage/production',
          items: [{ name: 'Scaling', url: '/guides/storage/production/scaling' }],
        },
        {
          name: 'Pricing',
          url: '/guides/storage/pricing' as `/${string}`,
          enabled: billingEnabled,
        },
      ],
    },
    {
      name: 'Analytics Buckets',
      items: [
        { name: 'Introduction', url: '/guides/storage/analytics/introduction' },
        {
          name: 'Creating Buckets',
          url: '/guides/storage/analytics/creating-analytics-buckets' as `/${string}`,
        },
        {
          name: 'Iceberg Catalog',
          url: '/guides/storage/analytics/connecting-to-analytics-bucket' as `/${string}`,
        },
        {
          name: 'Realtime Data-Sync',
          url: '/guides/storage/analytics/replication' as `/${string}`,
        },
        {
          name: 'Query with Postgres',
          url: '/guides/storage/analytics/query-with-postgres' as `/${string}`,
        },
        {
          name: 'Examples',
          url: '/guides/storage/analytics/examples' as `/${string}`,
          items: [
            {
              name: 'Using DuckDB',
              url: '/guides/storage/analytics/examples/duckdb',
            },
            {
              name: 'Using PyIceberg',
              url: '/guides/storage/analytics/examples/pyiceberg',
            },
            {
              name: 'Using Apache Spark',
              url: '/guides/storage/analytics/examples/apache-spark',
            },
          ],
        },
        {
          name: 'Limits',
          url: '/guides/storage/analytics/limits' as `/${string}`,
          enabled: billingEnabled,
        },
        {
          name: 'Pricing',
          url: '/guides/storage/analytics/pricing' as `/${string}`,
          enabled: billingEnabled,
        },
      ],
    },
    {
      name: 'Vector Buckets',
      url: '/guides/storage/vector',
      items: [
        { name: 'Introduction', url: '/guides/storage/vector/introduction' },
        {
          name: 'Creating Buckets',
          url: '/guides/storage/vector/creating-vector-buckets' as `/${string}`,
        },
        {
          name: 'Working with Indexes',
          url: '/guides/storage/vector/working-with-indexes' as `/${string}`,
        },
        {
          name: 'Storing Vectors',
          url: '/guides/storage/vector/storing-vectors' as `/${string}`,
        },
        {
          name: 'Querying Vectors',
          url: '/guides/storage/vector/querying-vectors' as `/${string}`,
        },
        {
          name: 'Limits',
          url: '/guides/storage/vector/limits' as `/${string}`,
          enabled: billingEnabled,
        },
      ],
    },
  ],
}

export const vectorIndexItems: Array<Partial<NavMenuSection>> = [
  {
    name: 'HNSW indexes',
    url: '/guides/ai/vector-indexes/hnsw-indexes',
  },
  {
    name: 'IVFFlat indexes',
    url: '/guides/ai/vector-indexes/ivf-indexes',
  },
]

export const ai: NavMenuConstant = {
  icon: 'ai',
  title: 'AI & Vectors',
  url: '/guides/ai',
  items: [
    { name: 'Overview', url: '/guides/ai' },
    { name: 'Concepts', url: '/guides/ai/concepts' },
    {
      name: 'Structured & unstructured',
      url: '/guides/ai/structured-unstructured',
    },
    {
      name: 'Learn',
      url: undefined,
      items: [
        { name: 'Vector columns', url: '/guides/ai/vector-columns' },
        {
          name: 'Vector indexes',
          url: '/guides/ai/vector-indexes',
          items: [
            {
              name: 'Overview',
              url: '/guides/ai/vector-indexes',
            },
            ...vectorIndexItems,
          ],
        },
        {
          name: 'Automatic embeddings',
          url: '/guides/ai/automatic-embeddings' as `/${string}`,
        },
        {
          name: 'Engineering for scale',
          url: '/guides/ai/engineering-for-scale' as `/${string}`,
        },
        {
          name: 'Choosing Compute Add-on',
          url: '/guides/ai/choosing-compute-addon' as `/${string}`,
        },
        { name: 'Going to Production', url: '/guides/ai/going-to-prod' },
        {
          name: 'RAG with Permissions',
          url: '/guides/ai/rag-with-permissions' as `/${string}`,
        },
      ],
    },
    {
      name: 'Search',
      url: undefined,
      items: [
        { name: 'Semantic search', url: '/guides/ai/semantic-search' },
        { name: 'Keyword search', url: '/guides/ai/keyword-search' },
        { name: 'Hybrid search', url: '/guides/ai/hybrid-search' },
      ],
    },
    {
      name: 'JavaScript Examples',
      url: undefined,
      items: [
        {
          name: 'OpenAI completions using Edge Functions',
          url: '/guides/ai/examples/openai' as `/${string}`,
        },

        {
          name: 'Generate image captions using Hugging Face',
          url: '/guides/ai/examples/huggingface-image-captioning' as `/${string}`,
        },
        {
          name: 'Generate Embeddings',
          url: '/guides/ai/quickstarts/generate-text-embeddings' as `/${string}`,
        },

        {
          name: 'Adding generative Q&A to your documentation',
          url: '/guides/ai/examples/headless-vector-search' as `/${string}`,
        },
        {
          name: 'Adding generative Q&A to your Next.js site',
          url: '/guides/ai/examples/nextjs-vector-search' as `/${string}`,
        },
      ],
    },
    {
      name: 'Python Client',
      url: undefined,
      items: [
        { name: 'Choosing a Client', url: '/guides/ai/python-clients' },
        { name: 'API', url: '/guides/ai/python/api' },
        { name: 'Collections', url: '/guides/ai/python/collections' },
        { name: 'Indexes', url: '/guides/ai/python/indexes' },
        { name: 'Metadata', url: '/guides/ai/python/metadata' },
      ],
    },
    {
      name: 'Python Examples',
      url: undefined,
      items: [
        {
          name: 'Developing locally with Vecs',
          url: '/guides/ai/vecs-python-client' as `/${string}`,
        },
        {
          name: 'Creating and managing collections',
          url: '/guides/ai/quickstarts/hello-world' as `/${string}`,
        },

        {
          name: 'Text Deduplication',
          url: '/guides/ai/quickstarts/text-deduplication' as `/${string}`,
        },
        {
          name: 'Face similarity search',
          url: '/guides/ai/quickstarts/face-similarity' as `/${string}`,
        },
        {
          name: 'Image search with OpenAI CLIP',
          url: '/guides/ai/examples/image-search-openai-clip' as `/${string}`,
        },
        {
          name: 'Semantic search with Amazon Titan',
          url: '/guides/ai/examples/semantic-image-search-amazon-titan' as `/${string}`,
        },
        {
          name: 'Building ChatGPT Plugins',
          url: '/guides/ai/examples/building-chatgpt-plugins' as `/${string}`,
        },
      ],
    },
    {
      name: 'Third-Party Tools',
      url: undefined,
      items: [
        {
          name: 'LangChain',
          url: '/guides/ai/langchain' as `/${string}`,
        },
        {
          name: 'Hugging Face',
          url: '/guides/ai/hugging-face' as `/${string}`,
        },
        {
          name: 'Google Colab',
          url: '/guides/ai/google-colab' as `/${string}`,
        },
        {
          name: 'LlamaIndex',
          url: '/guides/ai/integrations/llamaindex' as `/${string}`,
        },
        {
          name: 'Roboflow',
          url: '/guides/ai/integrations/roboflow' as `/${string}`,
        },
        {
          name: 'Amazon Bedrock',
          url: '/guides/ai/integrations/amazon-bedrock' as `/${string}`,
        },
        {
          name: 'Mixpeek',
          url: '/guides/ai/examples/mixpeek-video-search' as `/${string}`,
        },
      ],
    },
  ],
}

export const local_development: NavMenuConstant = {
  icon: 'dev-cli',
  title: 'Local Dev / CLI',
  url: '/guides/local-development',
  items: [
    { name: 'Overview', url: '/guides/local-development' },
    {
      name: 'CLI',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/local-development/cli/getting-started' },
        {
          name: 'Configuration',
          url: '/guides/local-development/cli/config',
          enabled: localDevelopmentEnabled,
        },
        { name: 'CLI commands', url: '/reference/cli' },
      ],
    },
    {
      name: 'Local development',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/local-development/overview' },
        {
          name: 'Declarative database schemas',
          url: '/guides/local-development/declarative-database-schemas' as `/${string}`,
        },
        {
          name: 'Seeding your database',
          url: '/guides/local-development/seeding-your-database' as `/${string}`,
        },
        {
          name: 'Managing config and secrets',
          url: '/guides/local-development/managing-config' as `/${string}`,
        },
        {
          name: 'Restoring downloaded backup',
          url: '/guides/local-development/restoring-downloaded-backup' as `/${string}`,
          enabled: localDevelopmentEnabled,
        },
        {
          name: 'Customizing email templates',
          url: '/guides/local-development/customizing-email-templates' as `/${string}`,
          enabled: localDevelopmentEnabled,
        },
      ],
    },
    {
      name: 'Testing',
      url: undefined,
      enabled: localDevelopmentEnabled,
      items: [
        { name: 'Getting started', url: '/guides/local-development/testing/overview' },
        {
          name: 'pgTAP advanced guide',
          url: '/guides/local-development/testing/pgtap-extended' as `/${string}`,
          enabled: pgTapEnabled,
        },
        { name: 'Database testing', url: '/guides/database/testing' },
        {
          name: 'RLS policies testing',
          url: '/guides/database/extensions/pgtap#testing-rls-policies' as `/${string}`,
        },
      ],
    },
  ],
}

export const contributing: NavMenuConstant = {
  icon: 'contributing',
  title: 'Contributing',
  url: '/contributing',
  enabled: contributionEnabled,
  items: [{ name: 'Overview', url: '/contributing' }],
}

export const MIGRATION_PAGES: Partial<NavMenuSection & ComponentProps<typeof IconPanel>>[] = [
  {
    name: 'Auth0',
    icon: '/docs/img/icons/auth0-icon',
    url: '/guides/platform/migrating-to-supabase/auth0',
    hasLightIcon: true,
  },
  {
    name: 'Firebase Auth',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firebase-auth',
  },
  {
    name: 'Firestore Data',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firestore-data',
  },
  {
    name: 'Firebase Storage',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firebase-storage',
  },
  {
    name: 'Heroku',
    icon: '/docs/img/icons/heroku-icon',
    url: '/guides/platform/migrating-to-supabase/heroku',
  },
  {
    name: 'Render',
    icon: '/docs/img/icons/render-icon',
    url: '/guides/platform/migrating-to-supabase/render',
  },
  {
    name: 'Amazon RDS',
    icon: '/docs/img/icons/aws-rds-icon',
    url: '/guides/platform/migrating-to-supabase/amazon-rds',
  },
  {
    name: 'Postgres',
    icon: '/docs/img/icons/postgres-icon',
    url: '/guides/platform/migrating-to-supabase/postgres',
  },
  {
    name: 'Vercel Postgres',
    icon: '/docs/img/icons/vercel-icon',
    url: '/guides/platform/migrating-to-supabase/vercel-postgres',
    hasLightIcon: true,
  },
  {
    name: 'Neon',
    icon: '/docs/img/icons/neon-icon',
    url: '/guides/platform/migrating-to-supabase/neon',
    hasLightIcon: true,
  },
  {
    name: 'MySQL',
    icon: '/docs/img/icons/mysql-icon',
    url: '/guides/platform/migrating-to-supabase/mysql',
  },
  {
    name: 'MSSQL',
    icon: '/docs/img/icons/mssql-icon',
    url: '/guides/platform/migrating-to-supabase/mssql',
  },
]

export const security: NavMenuConstant = {
  icon: 'security',
  title: 'Security',
  url: '/guides/security',
  items: [
    { name: 'Overview', url: '/guides/security' },
    {
      name: 'Product security',
      url: undefined,
      items: [
        { name: 'Platform configuration', url: '/guides/security/platform-security' },
        { name: 'Product configuration', url: '/guides/security/product-security' },
        { name: 'Security testing', url: '/guides/security/security-testing' },
        { name: 'Platform Audit Logs', url: '/guides/security/platform-audit-logs' },
      ],
    },
    {
      name: 'Compliance',
      url: undefined,
      enabled: complianceEnabled,
      items: [
        { name: 'SOC 2', url: '/guides/security/soc-2-compliance' },
        { name: 'HIPAA', url: '/guides/security/hipaa-compliance' },
      ],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        {
          name: 'Production Checklist',
          url: '/guides/deployment/going-into-prod',
          enabled: productionChecklistEnabled,
        },
        {
          name: 'Shared Responsibility Model',
          url: '/guides/deployment/shared-responsibility-model' as `/${string}`,
        },
        { name: 'Row Level Security', url: '/guides/database/postgres/row-level-security' },
        { name: 'Hardening the Data API', url: '/guides/database/hardening-data-api' },
      ],
    },
  ],
}

export const platform: NavMenuConstant = {
  icon: 'platform',
  title: 'Platform',
  url: '/guides/platform',
  items: [
    {
      name: 'Add-ons',
      url: undefined,
      items: [
        { name: 'Custom Domains', url: '/guides/platform/custom-domains' },
        { name: 'Database Backups', url: '/guides/platform/backups' },
        { name: 'IPv4 Address', url: '/guides/platform/ipv4-address' },
        {
          name: 'Read Replicas',
          url: '/guides/platform/read-replicas',
          items: [
            { name: 'Overview', url: '/guides/platform/read-replicas' as `/${string}` },
            {
              name: 'Getting started',
              url: '/guides/platform/read-replicas/getting-started' as `/${string}`,
            },
          ],
        },
      ],
    },
    {
      name: 'Upgrades & Migrations',
      url: undefined,
      enabled: fullPlatformEnabled,
      items: [
        { name: 'Upgrading', url: '/guides/platform/upgrading' },
        {
          name: 'Migrating within Supabase',
          url: '/guides/platform/migrating-within-supabase',
          items: [
            {
              name: 'Overview',
              url: '/guides/platform/migrating-within-supabase' as `/${string}`,
            },
            {
              name: 'Restore Dashboard backup',
              url: '/guides/platform/migrating-within-supabase/dashboard-restore' as `/${string}`,
            },
            {
              name: 'Backup and restore using CLI',
              url: '/guides/platform/migrating-within-supabase/backup-restore' as `/${string}`,
            },
          ],
        },
        {
          name: 'Migrating to Supabase',
          url: '/guides/platform/migrating-to-supabase',
          items: [
            { name: 'Overview', url: '/guides/platform/migrating-to-supabase' as `/${string}` },
            ...MIGRATION_PAGES,
          ],
        },
      ],
    },
    {
      name: 'Project & Account Management',
      url: undefined,
      items: [
        {
          name: 'Access Control',
          url: '/guides/platform/access-control' as `/${string}`,
        },
        {
          name: 'Multi-factor Authentication',
          url: '/guides/platform/multi-factor-authentication',
          enabled: fullPlatformEnabled,
          items: [
            {
              name: 'Overview',
              url: '/guides/platform/multi-factor-authentication' as `/${string}`,
            },
            {
              name: 'Enforce MFA on organization',
              url: '/guides/platform/mfa/org-mfa-enforcement' as `/${string}`,
            },
          ],
        },
        {
          name: 'Transfer Project',
          url: '/guides/platform/project-transfer' as `/${string}`,
          enabled: fullPlatformEnabled,
        },
        {
          name: 'Restore to a new project',
          url: '/guides/platform/clone-project',
        },
        {
          name: 'Single Sign-On',
          url: '/guides/platform/sso',
          enabled: fullPlatformEnabled,
          items: [
            { name: 'Overview', url: '/guides/platform/sso' as `/${string}` },
            { name: 'SSO with Azure AD', url: '/guides/platform/sso/azure' },
            {
              name: 'SSO with Google Workspace',
              url: '/guides/platform/sso/gsuite' as `/${string}`,
            },
            { name: 'SSO with Okta', url: '/guides/platform/sso/okta' },
          ],
        },
      ],
    },
    {
      name: 'Platform Configuration',
      url: undefined,
      items: [
        { name: 'Regions', url: '/guides/platform/regions' as `/${string}` },
        {
          name: 'Compute and Disk',
          url: '/guides/platform/compute-and-disk' as `/${string}`,
          enabled: fullPlatformEnabled,
        },
        {
          name: 'Database Size',
          url: '/guides/platform/database-size' as `/${string}`,
          enabled: fullPlatformEnabled,
        },
        { name: 'HIPAA Projects', url: '/guides/platform/hipaa-projects' as `/${string}` },
        {
          name: 'Network Restrictions',
          url: '/guides/platform/network-restrictions' as `/${string}`,
        },
        { name: 'Performance Tuning', url: '/guides/platform/performance' as `/${string}` },
        { name: 'SSL Enforcement', url: '/guides/platform/ssl-enforcement' as `/${string}` },
        {
          name: 'Default Platform Permissions',
          url: '/guides/platform/permissions' as `/${string}`,
        },
        { name: 'PrivateLink', url: '/guides/platform/privatelink' as `/${string}` },
      ],
    },
    {
      name: 'Billing',
      url: undefined,
      enabled: billingEnabled,
      items: [
        {
          name: 'About billing on Supabase',
          url: '/guides/platform/billing-on-supabase' as `/${string}`,
        },
        {
          name: 'Get set up for billing',
          url: '/guides/platform/get-set-up-for-billing' as `/${string}`,
        },
        {
          name: 'Manage your subscription',
          url: '/guides/platform/manage-your-subscription' as `/${string}`,
        },
        {
          name: 'Manage your usage',
          url: '/guides/platform/manage-your-usage',
          items: [
            {
              name: 'Overview',
              url: '/guides/platform/manage-your-usage' as `/${string}`,
            },
            {
              name: 'Compute',
              url: '/guides/platform/manage-your-usage/compute' as `/${string}`,
            },
            {
              name: 'Egress',
              url: '/guides/platform/manage-your-usage/egress' as `/${string}`,
            },
            {
              name: 'Disk Size',
              url: '/guides/platform/manage-your-usage/disk-size' as `/${string}`,
            },
            {
              name: 'Disk Throughput',
              url: '/guides/platform/manage-your-usage/disk-throughput' as `/${string}`,
            },
            {
              name: 'Disk IOPS',
              url: '/guides/platform/manage-your-usage/disk-iops' as `/${string}`,
            },
            {
              name: 'Monthly Active Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users' as `/${string}`,
            },
            {
              name: 'Monthly Active Third-Party Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users-third-party' as `/${string}`,
            },
            {
              name: 'Monthly Active SSO Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users-sso' as `/${string}`,
            },
            {
              name: 'Storage Size',
              url: '/guides/platform/manage-your-usage/storage-size' as `/${string}`,
            },
            {
              name: 'Storage Image Transformations',
              url: '/guides/platform/manage-your-usage/storage-image-transformations' as `/${string}`,
            },
            {
              name: 'Edge Function Invocations',
              url: '/guides/platform/manage-your-usage/edge-function-invocations' as `/${string}`,
            },
            {
              name: 'Realtime Messages',
              url: '/guides/platform/manage-your-usage/realtime-messages' as `/${string}`,
            },
            {
              name: 'Realtime Peak Connections',
              url: '/guides/platform/manage-your-usage/realtime-peak-connections' as `/${string}`,
            },
            {
              name: 'Custom Domains',
              url: '/guides/platform/manage-your-usage/custom-domains' as `/${string}`,
            },
            {
              name: 'Point-in-Time Recovery',
              url: '/guides/platform/manage-your-usage/point-in-time-recovery' as `/${string}`,
            },
            {
              name: 'IPv4',
              url: '/guides/platform/manage-your-usage/ipv4' as `/${string}`,
            },
            {
              name: 'MFA Phone',
              url: '/guides/platform/manage-your-usage/advanced-mfa-phone' as `/${string}`,
            },
            {
              name: 'Read Replicas',
              url: '/guides/platform/manage-your-usage/read-replicas' as `/${string}`,
            },
            {
              name: 'Branching',
              url: '/guides/platform/manage-your-usage/branching' as `/${string}`,
            },
            {
              name: 'Log Drains',
              url: '/guides/platform/manage-your-usage/log-drains' as `/${string}`,
            },
          ],
        },
        {
          name: 'Your monthly invoice',
          url: '/guides/platform/your-monthly-invoice' as `/${string}`,
        },
        {
          name: 'Control your costs',
          url: '/guides/platform/cost-control' as `/${string}`,
        },
        {
          name: 'Credits',
          url: '/guides/platform/credits' as `/${string}`,
        },
        {
          name: 'AWS Marketplace',
          url: '/guides/platform/aws-marketplace',
          items: [
            {
              name: 'Overview',
              url: '/guides/platform/aws-marketplace' as `/${string}`,
            },
            {
              name: 'Getting Started',
              url: '/guides/platform/aws-marketplace/getting-started',
            },
            {
              name: 'Account Setup',
              url: '/guides/platform/aws-marketplace/account-setup',
            },
            {
              name: 'Manage your subscription',
              url: '/guides/platform/aws-marketplace/manage-your-subscription',
            },
            {
              name: 'Invoices',
              url: '/guides/platform/aws-marketplace/invoices',
            },
            {
              name: 'FAQ',
              url: '/guides/platform/aws-marketplace/faq',
            },
          ],
        },
        {
          name: 'Billing FAQ',
          url: '/guides/platform/billing-faq' as `/${string}`,
        },
      ],
    },
  ],
}

export const telemetry: NavMenuConstant = {
  icon: 'telemetry',
  title: 'Telemetry',
  url: '/guides/telemetry',
  items: [
    { name: 'Overview', url: '/guides/telemetry' },
    {
      name: 'Logging & observability',
      url: undefined,
      items: [
        {
          name: 'Logging',
          url: '/guides/telemetry/logs' as `/${string}`,
        },
        {
          name: 'Advanced log filtering',
          url: '/guides/telemetry/advanced-log-filtering' as `/${string}`,
        },
        {
          name: 'Log drains',
          url: '/guides/telemetry/log-drains' as `/${string}`,
        },
        {
          name: 'Reports',
          url: '/guides/telemetry/reports' as `/${string}`,
        },
        {
          name: 'Metrics',
          url: '/guides/telemetry/metrics' as `/${string}`,
          items: [
            {
              name: 'Overview',
              url: '/guides/telemetry/metrics' as `/${string}`,
            },
            {
              name: 'Grafana Cloud',
              url: '/guides/telemetry/metrics/grafana-cloud' as `/${string}`,
            },
            {
              name: 'Grafana self-hosted',
              url: '/guides/telemetry/metrics/grafana-self-hosted' as `/${string}`,
            },
            {
              name: 'Datadog',
              url: 'https://docs.datadoghq.com/integrations/supabase/' as `/${string}`,
            },
            {
              name: 'Vendor-agnostic setup',
              url: '/guides/telemetry/metrics/vendor-agnostic' as `/${string}`,
            },
          ],
        },
        {
          name: 'Sentry integration',
          url: '/guides/telemetry/sentry-monitoring' as `/${string}`,
        },
      ],
    },
  ],
}

export const resources: NavMenuConstant = {
  icon: 'resources',
  title: 'Resources',
  url: '/guides/resources',
  items: [{ name: 'Glossary', url: '/guides/resources/glossary' }],
}

export const self_hosting: NavMenuConstant = {
  title: 'Self-Hosting',
  icon: 'self-hosting',
  url: '/guides/self-hosting',
  items: [
    { name: 'Overview', url: '/guides/self-hosting' },
    { name: 'Self-Hosting with Docker', url: '/guides/self-hosting/docker' },
    {
      name: 'How-to Guides',
      items: [
        { name: 'Enabling MCP server', url: '/guides/self-hosting/enable-mcp' },
        { name: 'Restore from Platform', url: '/guides/self-hosting/restore-from-platform' },
        { name: 'Configure S3 Storage', url: '/guides/self-hosting/self-hosted-s3' },
        { name: 'Copy Storage from Platform', url: '/guides/self-hosting/copy-from-platform-s3' },
      ],
    },
    {
      name: 'Auth Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-auth/introduction' },
        { name: 'Configuration', url: '/guides/self-hosting/auth/config' },
      ],
    },
    {
      name: 'Storage Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-storage/introduction' as `/${string}`,
        },
        { name: 'Configuration', url: '/guides/self-hosting/storage/config' },
      ],
    },
    {
      name: 'Realtime Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-realtime/introduction' as `/${string}`,
        },
        { name: 'Configuration', url: '/guides/self-hosting/realtime/config' },
      ],
    },
    {
      name: 'Analytics Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-analytics/introduction',
          items: [],
        },
        {
          name: 'Configuration',
          url: '/guides/self-hosting/analytics/config',
          items: [],
        },
      ],
    },
    {
      name: 'Functions Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-functions/introduction',
          items: [],
        },
      ],
    },
  ],
}

export const deployment: NavMenuConstant = {
  title: 'Deployment & Branching',
  url: '/guides/deployment',
  icon: 'git-branch',
  items: [
    { name: 'Overview', url: '/guides/deployment' },
    {
      name: 'Environments',
      items: [
        { name: 'Managing environments', url: '/guides/deployment/managing-environments' },
        { name: 'Database migrations', url: '/guides/deployment/database-migrations' },
      ],
    },
    {
      name: 'Branching',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/deployment/branching' },
        { name: 'Branching via GitHub', url: '/guides/deployment/branching/github-integration' },
        {
          name: 'Branching via dashboard',
          url: '/guides/deployment/branching/dashboard' as `/${string}`,
        },

        {
          name: 'Working with branches',
          url: '/guides/deployment/branching/working-with-branches' as `/${string}`,
        },
        { name: 'Configuration', url: '/guides/deployment/branching/configuration' },
        { name: 'Integrations', url: '/guides/deployment/branching/integrations' },
        { name: 'Troubleshooting', url: '/guides/deployment/branching/troubleshooting' },
        { name: 'Billing', url: '/guides/platform/manage-your-usage/branching' },
      ],
    },
    {
      name: 'Terraform',
      items: [
        { name: 'Terraform provider', url: '/guides/deployment/terraform' },
        { name: 'Terraform tutorial', url: '/guides/deployment/terraform/tutorial' },
        { name: 'Terraform reference', url: '/guides/deployment/terraform/reference' },
      ],
    },
    {
      name: 'Production readiness',
      items: [
        {
          name: 'Shared responsibility model',
          url: '/guides/deployment/shared-responsibility-model' as `/${string}`,
        },
        { name: 'Maturity model', url: '/guides/deployment/maturity-model' },
        {
          name: 'Production checklist',
          url: '/guides/deployment/going-into-prod',
          enabled: productionChecklistEnabled,
        },
        { name: 'SOC 2 compliance', url: '/guides/security/soc-2-compliance' },
      ],
    },
    {
      name: 'CI/CD',
      items: [
        {
          name: 'Generate types from your database',
          url: '/guides/deployment/ci/generating-types' as `/${string}`,
        },
        { name: 'Automated testing', url: '/guides/deployment/ci/testing' },
        { name: 'Back up your database', url: '/guides/deployment/ci/backups' },
      ],
    },
  ],
}

export const integrations: NavMenuConstant = {
  title: 'Integrations',
  icon: 'integrations',
  url: '/guides/integrations',
  enabled: integrationsEnabled,
  items: [
    {
      name: 'Overview',
      url: '/guides/integrations',
    },
    {
      name: 'Vercel Marketplace',
      url: '/guides/integrations/vercel-marketplace',
    },
    {
      name: 'Supabase Marketplace',
      url: '/guides/integrations/supabase-marketplace',
    },
    {
      name: 'Build Your Own',
      items: [
        {
          name: 'Supabase OAuth Integration',
          url: '/guides/integrations/build-a-supabase-oauth-integration',
          items: [
            {
              name: 'Overview',
              url: '/guides/integrations/build-a-supabase-oauth-integration',
            },
            {
              name: 'OAuth scopes',
              url: '/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes',
            },
          ],
        },
        {
          name: 'Supabase for Platforms',
          url: '/guides/integrations/supabase-for-platforms',
        },
      ],
    },
    { name: 'Integrations', url: undefined, items: [] },
  ],
}

export const reference = {
  title: 'API Reference',
  icon: 'reference',
  items: [
    {
      name: 'Client libraries',
      items: [
        {
          name: 'supabase-js',
          url: '/reference/javascript/start',
          level: 'reference_javascript',
          icon: '/img/icons/menu/reference-javascript' as `/${string}`,
        },
        {
          name: 'supabase-dart',
          url: '/reference/dart/start',
          level: 'reference_dart',
          icon: '/img/icons/menu/reference-dart' as `/${string}`,
          enabled: sdkDartEnabled,
        },
        {
          name: 'supabase-csharp',
          url: '/reference/csharp/start',
          level: 'reference_csharp',
          icon: '/img/icons/menu/reference-csharp' as `/${string}`,
          enabled: sdkCsharpEnabled,
        },
        {
          name: 'supbase-python',
          url: '/reference/python/start',
          level: 'reference_python',
          icon: '/img/icons/menu/reference-python' as `/${string}`,
          enabled: sdkPythonEnabled,
        },
        {
          name: 'supbase-swift',
          url: '/reference/swift/start',
          level: 'reference_swift',
          items: [],
          icon: '/img/icons/menu/reference-swift' as `/${string}`,
          enabled: sdkSwiftEnabled,
        },
        {
          name: 'supabase-kt',
          url: '/reference/kotlin/start',
          level: 'reference_kotlin',
          items: [],
          icon: '/img/icons/menu/reference-kotlin' as `/${string}`,
          enabled: sdkKotlinEnabled,
        },
      ],
    },
    {
      name: 'Other tools',
      items: [
        {
          name: 'Supabase CLI',
          url: '/reference/cli/start',
          icon: '/img/icons/menu/reference-cli' as `/${string}`,
        },
        {
          name: 'Management API',
          url: '/reference/javascript',
          icon: '/img/icons/menu/reference-api' as `/${string}`,
        },
      ],
    },
  ],
}

export const reference_javascript_v1 = {
  icon: 'reference-javascript',
  title: 'JavaScript',
  url: '/guides/reference/javascript',
  parent: '/reference',
  pkg: {
    name: '@supabase/supabase-js',
    repo: 'https://github.com/supabase/supabase-js',
  },
}

export const reference_javascript_v2 = {
  icon: 'reference-javascript',
  title: 'JavaScript',
  url: '/guides/reference/javascript',
  parent: '/reference',
  pkg: {
    name: '@supabase/supabase-js',
    repo: 'https://github.com/supabase/supabase-js',
  },
}

// TODO: How to?
export const reference_dart_v1 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
  pkg: {
    name: 'supabase_flutter',
    repo: 'https://github.com/supabase/supabase-flutter',
  },
}

export const reference_dart_v2 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
  pkg: {
    name: 'supabase_flutter',
    repo: 'https://github.com/supabase/supabase-flutter',
  },
}

export const reference_csharp_v0 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase-community/supabase-csharp',
  },
}

export const reference_csharp_v1 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase-community/supabase-csharp',
  },
}

export const reference_python_v2 = {
  icon: 'reference-python',
  title: 'Python',
  url: '/guides/reference/python',
  parent: '/reference',
  pkg: {
    name: 'supabase-py',
    repo: 'https://github.com/supabase/supabase-py',
  },
}

export const reference_swift_v1 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
  pkg: {
    name: 'supabase-swift',
    repo: 'https://github.com/supabase/supabase-swift',
  },
}

export const reference_swift_v2 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
  pkg: {
    name: 'supabase-swift',
    repo: 'https://github.com/supabase/supabase-swift',
  },
}

export const reference_kotlin_v1 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_kotlin_v2 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_kotlin_v3 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_cli = {
  icon: 'reference-cli',
  title: 'Supabase CLI',
  url: '/guides/reference/cli',
  parent: '/',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase/cli',
  },
}
export const reference_api = {
  icon: 'reference-api',
  title: 'Management API',
  url: '/guides/reference/api',
  parent: '/reference',
}

export const reference_self_hosting_auth = {
  icon: 'self-hosting',
  title: 'Self-Hosting Auth',
  url: '/guides/reference/self-hosting/auth',
  parent: '/reference',
}

export const reference_self_hosting_storage = {
  icon: 'self-hosting',
  title: 'Self-Hosting Storage',
  url: '/guides/reference/self-hosting/storage',
  parent: '/reference',
}

export const reference_self_hosting_realtime = {
  icon: 'self-hosting',
  title: 'Self-Hosting Realtime',
  url: '/guides/reference/self-hosting/realtime',
  parent: '/reference',
}

export const reference_self_hosting_analytics = {
  icon: 'reference-analytics',
  title: 'Self-Hosting Analytics',
  url: '/guides/reference/self-hosting/analytics',
  parent: '/reference',
}

export const reference_self_hosting_functions = {
  icon: 'reference-functions',
  title: 'Self-Hosting Functions',
  url: '/guides/reference/self-hosting/functions',
  parent: '/reference',
}

export const references = [
  {
    label: 'Client libraries',
    items: [
      {
        label: 'supabase-js',
        versions: ['v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/javascript-icon.svg',
        url: '/reference/javascript/start',
      },
      {
        label: 'supabase-py',
        description: 'something about the reference',
        icon: '/docs/img/icons/python-icon.svg',
        url: '/reference/python/start',
        enabled: sdkPythonEnabled,
      },
      {
        label: 'supabase-dart',
        versions: ['v1', 'v0'],
        description: 'something about the reference',
        icon: '/docs/img/icons/dart-icon.svg',
        url: '/reference/dart/start',
        enabled: sdkDartEnabled,
      },
      {
        label: 'supabase-csharp',
        versions: ['v0'],
        description: 'something about the reference',
        icon: '/docs/img/icons/c-sharp-icon.svg',
        url: '/reference/csharp/start',
        enabled: sdkCsharpEnabled,
      },
      {
        label: 'supabase-swift',
        versions: ['v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/swift-icon.svg',
        url: '/reference/swift/start',
        enabled: sdkSwiftEnabled,
      },
      {
        label: 'supabase-kt',
        versions: ['v3', 'v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/kotlin-icon.svg',
        url: '/reference/kotlin/start',
        enabled: sdkKotlinEnabled,
      },
    ],
  },
  {
    label: 'Platform Tools',
    items: [
      {
        label: 'CLI',
        description: 'something about the reference',
        icon: '/docs/img/icons/cli-icon.svg',
        url: '/reference/cli/start',
      },
      {
        label: 'Management API',
        description: 'something about the reference',
        icon: '/docs/img/icons/api-icon.svg',
        url: '/reference/management-api/start',
      },
    ],
  },
  {
    label: 'Self-Hosting',
    items: [
      {
        label: 'Auth server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/auth.svg',
        url: '/reference/auth/start',
      },
      {
        label: 'Storage server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/storage.svg',
        url: '/reference/storage/start',
      },
      {
        label: 'Realtime server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/realtime.svg',
        url: '/reference/realtime/start',
      },
    ],
  },
]

export const navDataForMdx = {
  migrationPages: MIGRATION_PAGES,
  nativeMobileLoginItems: NativeMobileLoginItems,
  phoneLoginsItems: PhoneLoginsItems,
  socialLoginItems: SocialLoginItems,
  ormQuickstarts,
  guiQuickstarts,
}
