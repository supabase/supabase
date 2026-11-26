import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { integrationsPartners: integrationsEnabled } = isFeatureEnabled(['integrations:partners'])

export const integrations: NavMenuConstant = {
  title: 'Integrations',
  icon: 'integrations',
  url: '/guides/integrations',
  enabled: integrationsEnabled,
  items: [
    { name: 'Partner Catalog', url: '/guides/integrations/partner-catalog' },
    { name: 'Vercel Marketplace', url: '/guides/integrations/vercel-marketplace' },
    { name: 'Stripe Projects', url: '/guides/integrations/stripe-projects' },
    { name: 'Preview branches on Vercel', url: '/guides/integrations/vercel-preview-branches' },
    {
      name: 'Build your own integration',
      items: [
        {
          name: 'Supabase OAuth Integration',
          items: [
            { name: 'Overview', url: '/guides/integrations/build-a-supabase-oauth-integration' },
            {
              name: 'OAuth scopes',
              url: '/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes',
            },
            {
              name: 'Scoped access',
              url: '/guides/integrations/build-a-supabase-oauth-integration/scoped-access',
            },
            {
              name: 'Update your app',
              url: '/guides/integrations/build-a-supabase-oauth-integration/update-for-scoped-access',
            },
            {
              name: 'Test on staging',
              url: '/guides/integrations/build-a-supabase-oauth-integration/test-scoped-access',
            },
            {
              name: 'Manage app access',
              url: '/guides/integrations/build-a-supabase-oauth-integration/manage-oauth-app-access',
            },
            {
              name: 'MCP with scoped access',
              url: '/guides/integrations/build-a-supabase-oauth-integration/mcp-scoped-access',
            },
          ],
        },
        { name: 'Supabase for Platforms', url: '/guides/integrations/supabase-for-platforms' },
        {
          name: 'Supabase partner integration guide',
          url: '/guides/integrations/partner-integration-guide',
        },
      ],
    },
    // NavigationMenuGuideList fills this with the federated partner integrations.
    { name: 'Integrations', items: [] },
  ],
}
