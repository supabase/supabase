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
    { name: 'Preview branches on Vercel', url: '/guides/deployment/branching/integrations#vercel' },
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
