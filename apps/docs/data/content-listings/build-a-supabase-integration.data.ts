import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const buildIntegrationCatalogPath: ContentListingGroup = {
  id: 'build-integration-catalog-path',
  type: 'progression',
  labelledBy: 'partner-catalog-path',
  items: [
    {
      title: 'Apply',
      subtitle: 'Partners program',
      href: '#apply-to-the-partners-program',
      icon: 'rls',
    },
    {
      title: 'Build your landing page',
      subtitle: 'Guide for users to integrate',
      href: '#partner-catalog-build-your-landing-page',
      icon: 'database',
    },
    {
      title: 'Publish',
      subtitle: 'Users find you',
      href: '#publish',
      icon: 'production',
    },
  ],
}

export const buildIntegrationIntegrationPath: ContentListingGroup = {
  id: 'build-integration-integration-path',
  type: 'progression',
  labelledBy: 'integration-path',
  items: [
    {
      title: 'Apply',
      subtitle: 'Partners program',
      href: '#apply-to-the-partners-program',
      icon: 'rls',
    },
    {
      title: 'Build the OAuth flow',
      subtitle: 'Users connect securely',
      href: '#build-the-oauth-flow',
      icon: 'auth',
    },
    {
      title: 'Build the integration',
      subtitle: 'Management API',
      href: '#build-the-integration',
      icon: 'functions',
    },
    {
      title: 'Publish',
      subtitle: 'Users find you',
      href: '#publish',
      icon: 'production',
    },
  ],
}

export const buildIntegrationLandingPageBuild: ContentListingGroup = {
  id: 'build-integration-landing-page-build',
  heading: 'Build it',
  headingAnchor: 'build-it-landing-page',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Postgres connection',
      href: '/guides/database/connecting-to-postgres',
      description: "Connect any Postgres client or driver to a project's database.",
    },
    {
      title: 'Project REST API',
      href: '/guides/api',
      description: "Read and write a project's data over HTTP, with client libraries.",
    },
    {
      title: 'Project GraphQL API',
      href: '/guides/graphql',
      description: "Query a project's data with GraphQL.",
    },
  ],
}

export const buildIntegrationOauthBuild: ContentListingGroup = {
  id: 'build-integration-oauth-build',
  heading: 'Build it',
  headingAnchor: 'build-it-oauth',
  headingLevel: 'h4',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Create an OAuth app',
      href: '/guides/integrations/build-a-supabase-oauth-integration',
      description:
        "In your organization's settings, open the OAuth Apps tab and click Add application.",
    },
    {
      title: 'Choose scopes',
      href: '/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes',
      description: 'Request only the permissions your integration needs.',
    },
    {
      title: 'Build the redirect endpoint',
      href: '/guides/integrations/partner-integration-guide',
      description:
        'Handle the users that the Install integration button sends to your install URL.',
    },
    {
      title: 'Implement the OAuth flow',
      href: '/guides/integrations/build-a-supabase-oauth-integration#show-a-connect-supabase-button',
      description:
        'Send users to Supabase to approve access, exchange the code for tokens, and refresh them.',
    },
  ],
}

export const buildIntegrationApiBuild: ContentListingGroup = {
  id: 'build-integration-api-build',
  heading: 'Build it',
  headingAnchor: 'build-it-api',
  headingLevel: 'h4',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Management API reference',
      href: '/reference/api/introduction',
      description: 'Look up the endpoints your scopes allow.',
    },
  ],
}
